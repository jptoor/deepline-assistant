import { describe, expect, it } from "vitest";
import { pageContext } from "../../src/shared/context";

describe("pageContext", () => {
  it("reads a LinkedIn profile from URL and title only", () => {
    const c = pageContext("https://www.linkedin.com/in/Jane-Doe-123/?trk=x", "(3) Jane Doe | LinkedIn");
    expect(c).toMatchObject({ kind: "linkedin_person", entity_key: "linkedin:in:jane-doe-123", linkedin_url: "https://www.linkedin.com/in/jane-doe-123/", full_name: "Jane Doe", first_name: "Jane", last_name: "Doe" });
  });
  it("never labels a Sales Navigator lead URL as a public profile", () => {
    const c = pageContext("https://www.linkedin.com/sales/lead/ACwAAA1234567,NAME_SEARCH,abc", "Sam Lee | Sales Navigator");
    expect(c.kind).toBe("salesnav_lead");
    expect(c.linkedin_url).toBeUndefined();
    expect(c.sales_navigator_url).toBe("https://www.linkedin.com/sales/lead/ACwAAA1234567");
  });
  it("reads companies, searches and lists", () => {
    expect(pageContext("https://www.linkedin.com/company/acme/about/", "Acme | LinkedIn")).toMatchObject({ kind: "linkedin_company", company_linkedin_url: "https://www.linkedin.com/company/acme/", company_name: "Acme" });
    expect(pageContext("https://www.linkedin.com/sales/search/people?query=(x)").kind).toBe("salesnav_search");
    expect(pageContext("https://www.linkedin.com/search/results/people/?keywords=cfo").search_url).toContain("keywords=cfo");
    expect(pageContext("https://www.linkedin.com/sales/lists/people/7012", "Q4 targets | Sales Navigator")).toMatchObject({ kind: "salesnav_list", entity_key: "salesnav:list:7012", label: "Q4 targets" });
    expect(pageContext("https://www.linkedin.com/feed/").kind).toBe("unsupported");
  });
  it("reads CRM record ids from the URL", () => {
    expect(pageContext("https://acme.lightning.force.com/lightning/r/Contact/003Ak00000ABCDeIAX/view")).toMatchObject({ kind: "crm_record", crm_system: "salesforce", crm_object: "Contact", crm_id: "003Ak00000ABCDeIAX" });
    expect(pageContext("https://app.hubspot.com/contacts/123/record/0-2/456")).toMatchObject({ crm_system: "hubspot", crm_object: "company", crm_id: "456" });
  });
  it("treats company sites as domains and skips tools", () => {
    expect(pageContext("https://www.acme.io/pricing", "Pricing - Acme")).toMatchObject({ kind: "website", domain: "acme.io", entity_key: "domain:acme.io" });
    expect(pageContext("https://app.acme.io/")).toMatchObject({ domain: "acme.io" });
    for (const u of ["https://mail.google.com/mail/u/0/", "https://www.google.com/search?q=x", "chrome://newtab", "http://acme.io", "not a url"]) expect(pageContext(u).kind).toBe("unsupported");
  });
});
