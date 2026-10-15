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
