import { describe, expect, it } from "vitest";
import { pageContext } from "../../src/shared/context";
import { inputFor, pollRun, startRun, toSummary } from "../../src/shared/deepline";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const cred = { baseUrl: "https://code.deepline.com", apiKey: "dl_test" };

describe("inputFor", () => {
  const profile = pageContext("https://www.linkedin.com/in/jane/", "Jane Doe | LinkedIn");
  it("sends only declared fields", () => {
    const play = toSummary({ playKey: "prebuilt/person-linkedin-to-email", inputSchema: { properties: { linkedin_url: {}, other: {} }, required: ["linkedin_url"] } })!;
    expect(inputFor(play, profile)).toEqual({ input: { linkedin_url: "https://www.linkedin.com/in/jane/" }, missing: [] });
  });
  it("reports required fields the page cannot fill", () => {
    const play = toSummary({ playKey: "p", inputSchema: { properties: { first_name: {}, domain: {} }, required: ["first_name", "domain"] } })!;
    expect(inputFor(play, profile).missing).toEqual(["domain"]);
  });
  it("passes the whole context to a play that declares it", () => {
    const play = toSummary({ playKey: "p", inputSchema: { properties: { context: {} } } })!;
    expect(inputFor(play, profile).input.context).toBe(profile);
  });
  it("trims context to the keys a strict play declares", () => {
    const play = toSummary({ playKey: "p", inputSchema: { properties: { context: { properties: { kind: {}, linkedin_url: {} } } }, required: ["context"] } })!;
    expect(inputFor(play, profile).input.context).toEqual({ kind: "linkedin_person", linkedin_url: "https://www.linkedin.com/in/jane/" });
  });
});

describe("runs", () => {
  it("returns inline outputs when the run finishes inside the wait window", async () => {
    let sent: unknown;
    const r = await startRun(cred, "p", { a: 1 }, async (_u, init) => {
      sent = JSON.parse(String(init?.body));
      return json({ run: { id: "run_1", status: "completed" }, outputs: { result: { kind: "value", path: "result", value: { email: "j@acme.io" } } } });
    });
    expect(sent).toEqual({ name: "p", input: { a: 1 }, waitForCompletionMs: 15000 });
    expect(r).toEqual({ runId: "run_1", status: "completed", result: { result: { email: "j@acme.io" } }, error: null });
  });
  it("polls the constant-size status and fetches the package only when terminal", async () => {
    const urls: string[] = [];
    const f = async (u: string) => {
      urls.push(u);
      return u.endsWith("/status") ? json({ available: true, lifecycle: { status: "running" } }) : json({});
    };
    expect((await pollRun(cred, "run_1", f)).status).toBe("running");
    expect(urls).toEqual(["https://code.deepline.com/api/v2/runs/run_1/status"]);
  });
  it("fails loudly on auth errors", async () => {
    await expect(startRun(cred, "p", {}, async () => json({}, 401))).rejects.toThrow("Not signed in");
  });
});
