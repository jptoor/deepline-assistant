import { describe, expect, it } from "vitest";
import { pageContext } from "../../src/shared/context";
import { contactFields, finishSql, listSql, lit, startSql } from "../../src/shared/records";

describe("records", () => {
  it("escapes every literal", () => {
    expect(lit("o'neil")).toBe("'o''neil'");
    expect(lit(null)).toBe("NULL");
    expect(listSql("a'b@x.io", 5000)).toContain("WHERE owner = 'a''b@x.io' ORDER BY updated_at DESC LIMIT 1000");
  });
  it("upserts one row per rep, entity and play", () => {
    const sql = startSql("me@x.io", pageContext("https://www.linkedin.com/in/jane/", "Jane O'Doe | LinkedIn"), "prebuilt/p", "run_1", "running");
    expect(sql).toContain("'linkedin:in:jane'");
    expect(sql).toContain("'Jane O''Doe'");
    expect(sql).toContain("ON CONFLICT (owner, entity_key, play_key)");
  });
  it("lifts email and phone out of any play result", () => {
    expect(contactFields({ result: { work_email: "j@acme.io", data: { mobile_phone: "+1 415 555 0100" } } })).toEqual({ email: "j@acme.io", phone: "+1 415 555 0100" });
    expect(contactFields({ email: "not an email", phone: "n/a" })).toEqual({ email: null, phone: null });
    expect(finishSql({ owner: "o", entity_key: "e", play_key: "p" }, "completed", { email: "j@acme.io" }, null)).toContain("COALESCE('j@acme.io', email)");
  });
});

import { DEFAULT_CONFIG, SETUP_SQL, parseConfig } from "../../src/shared/records";
import { costLabel, maxCredits } from "../../src/shared/deepline";

describe("team config", () => {
  it("falls back to defaults for missing or malformed keys", () => {
    expect(parseConfig(null)).toEqual(DEFAULT_CONFIG);
    const c = parseConfig({ actions: { person: ["a", 3] }, handoffs: "x", confirm_over_credits: -1 });
    expect(c.actions.person).toEqual(["a"]);
    expect(c.actions.company).toEqual([]);
    expect(c.handoffs).toEqual([]);
    expect(c.confirm_over_credits).toBe(25);
  });
  it("seeds the default config without overwriting a team's", () => {
    expect(SETUP_SQL.at(-1)).toContain("ON CONFLICT (id) DO NOTHING");
  });
});

describe("cost labels", () => {
  it("reads like a price tag", () => {
    expect(costLabel(null)).toBe("cost varies");
    expect(costLabel({ low: 3, high: 3, perRow: false })).toBe("~3 credits");
    expect(costLabel({ low: 1, high: 1, perRow: false })).toBe("~1 credit");
    expect(costLabel({ low: 1, high: 4, perRow: false })).toBe("1–4 credits");
    expect(costLabel({ low: 0, high: 0, perRow: false })).toBe("free");
  });
  it("scales per-row plays by the import cap", () => {
    expect(costLabel({ low: 2, high: 3, perRow: true }, 25)).toBe("50–75 credits");
    expect(maxCredits({ low: 2, high: 3, perRow: true }, 25)).toBe(75);
    expect(maxCredits({ low: 2, high: 3, perRow: false }, 25)).toBe(3);
  });
});
