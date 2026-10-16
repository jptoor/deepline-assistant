/** Page context: everything the assistant knows about a tab comes from its URL
 *  and title. No DOM is read, nothing is injected, and LinkedIn never sees the
 *  extension. Plays resolve the rest server-side. Pure, so it is unit-tested. */

export type PageKind =
  | "linkedin_person"
  | "salesnav_lead"
  | "linkedin_company"
  | "linkedin_search"
  | "salesnav_search"
  | "salesnav_list"
  | "crm_record"
  | "website"
  | "unsupported";

export interface PageContext {
  kind: PageKind;
  /** Stable identity for this entity; the row key in the user's table. */
  entity_key: string | null;
  url: string;
  label: string;
  linkedin_url?: string;
  sales_navigator_url?: string;
  company_linkedin_url?: string;
  search_url?: string;
  domain?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  crm_system?: "salesforce" | "hubspot";
  crm_object?: string;
  crm_id?: string;
  /** Set by the panel, not the page: the rep's import cap, or a finished result's contact fields for a handoff. */
  limit?: number;
  email?: string;
  phone?: string;
}

export type PageGroup = "person" | "company" | "search" | "crm";
export const KIND_GROUP: Partial<Record<PageKind, PageGroup>> = {
  linkedin_person: "person",
  salesnav_lead: "person",
  linkedin_company: "company",
  website: "company",
  linkedin_search: "search",
  salesnav_search: "search",
  salesnav_list: "search",
  crm_record: "crm"
};

/** Hosts that are tools, not companies: no "company website" context there. */
const NOT_A_COMPANY = /(^|\.)(google|bing|duckduckgo|youtube|facebook|instagram|x|twitter|reddit|github|notion|slack|zoom|figma|deepline|chromewebstore\.google|gmail|outlook\.live|office|live|microsoft|apple|amazon|wikipedia)\.[a-z.]+$|(^|\.)(mail|docs|drive|calendar|meet)\.google\.com$/;

/** "(3) Jane Doe | LinkedIn" -> "Jane Doe" */
function titleName(title: string): string | null {
  const head = title.replace(/^\(\d+\+?\)\s*/, "").split(/\s+[|·–-]\s+/)[0]?.trim();
  return head && !/^(linkedin|sales navigator)$/i.test(head) ? head.slice(0, 200) : null;
}

function splitName(full: string): { first_name: string; last_name?: string } {
  const parts = full.replace(/\s*\(.*?\)\s*/g, " ").trim().split(/\s+/);
  return parts.length > 1 ? { first_name: parts[0], last_name: parts.slice(1).join(" ") } : { first_name: parts[0] };
}

export function pageContext(rawUrl: string | undefined, title = ""): PageContext {
  const none: PageContext = { kind: "unsupported", entity_key: null, url: rawUrl ?? "", label: "" };
  let u: URL;
  try {
    u = new URL(rawUrl ?? "");
  } catch {
    return none;
  }
  if (u.protocol !== "https:") return none;
  const host = u.hostname.replace(/^www\./, "");
  const path = u.pathname;

  if (host === "linkedin.com") {
    let m = path.match(/^\/in\/([^/]+)/);
    if (m) {
      const slug = decodeURIComponent(m[1]).toLowerCase();
      const full = titleName(title);
      return { kind: "linkedin_person", entity_key: `linkedin:in:${slug}`, url: u.href, label: full ?? slug, linkedin_url: `https://www.linkedin.com/in/${slug}/`, ...(full ? { full_name: full, ...splitName(full) } : {}) };
    }
    m = path.match(/^\/sales\/lead\/([A-Za-z0-9_-]{8,80})/);
    if (m) {
      const full = titleName(title);
      return { kind: "salesnav_lead", entity_key: `salesnav:lead:${m[1]}`, url: u.href, label: full ?? "Sales Navigator lead", sales_navigator_url: `https://www.linkedin.com/sales/lead/${m[1]}`, ...(full ? { full_name: full, ...splitName(full) } : {}) };
    }
    m = path.match(/^\/(?:company|school)\/([^/]+)/) ?? path.match(/^\/sales\/company\/(\d+)/);
    if (m) {
      const slug = decodeURIComponent(m[1]).toLowerCase();
      const name = titleName(title);
      const isSales = path.startsWith("/sales/");
      return { kind: "linkedin_company", entity_key: `linkedin:company:${slug}`, url: u.href, label: name ?? slug, company_linkedin_url: isSales ? u.href.split("?")[0] : `https://www.linkedin.com/company/${slug}/`, ...(name ? { company_name: name } : {}) };
    }
    if (path.startsWith("/sales/search/people") || path.startsWith("/sales/search/company")) {
      return { kind: "salesnav_search", entity_key: `search:${u.href}`, url: u.href, label: "Sales Navigator search", search_url: u.href };
    }
    m = path.match(/^\/sales\/lists\/(?:people|company)\/(\d+)/);
    if (m) return { kind: "salesnav_list", entity_key: `salesnav:list:${m[1]}`, url: u.href, label: titleName(title) ?? "Sales Navigator list", search_url: u.href };
    if (path.startsWith("/search/results/")) {
      return { kind: "linkedin_search", entity_key: `search:${u.href}`, url: u.href, label: "LinkedIn search", search_url: u.href };
    }
    return none;
  }

  // Salesforce Lightning: /lightning/r/<Object>/<Id>/view
  let m = host.endsWith(".lightning.force.com") || host.endsWith(".my.salesforce.com") ? path.match(/^\/lightning\/r\/(\w+)\/([a-zA-Z0-9]{15,18})\//) : null;
  if (m) return { kind: "crm_record", entity_key: `crm:salesforce:${m[1]}:${m[2]}`, url: u.href, label: titleName(title) ?? `${m[1]} ${m[2]}`, crm_system: "salesforce", crm_object: m[1], crm_id: m[2] };
  // HubSpot: /contacts/<portal>/record/<objectType>/<id>
  m = host === "app.hubspot.com" ? path.match(/^\/contacts\/\d+\/(?:record\/(0-\d+)|(contact|company|deal))\/(\d+)/) : null;
  if (m) {
    const object = ({ "0-1": "contact", "0-2": "company", "0-3": "deal" } as Record<string, string>)[m[1] ?? ""] ?? m[2] ?? m[1];
    return { kind: "crm_record", entity_key: `crm:hubspot:${object}:${m[3]}`, url: u.href, label: titleName(title) ?? `HubSpot ${object} ${m[3]}`, crm_system: "hubspot", crm_object: object, crm_id: m[3] };
  }

  if (NOT_A_COMPANY.test(host) || !host.includes(".")) return none;
  const domain = host.split(".").slice(-3).join(".").replace(/^(app|www\d?|en|us|blog|about)\./, "");
  return { kind: "website", entity_key: `domain:${domain}`, url: u.href, label: domain, domain, company_name: titleName(title) ?? undefined };
}

export const KIND_LABEL: Record<PageKind, string> = {
  linkedin_person: "LinkedIn profile",
  salesnav_lead: "Sales Navigator lead",
  linkedin_company: "Company",
  linkedin_search: "LinkedIn search",
  salesnav_search: "Sales Navigator search",
  salesnav_list: "Sales Navigator list",
  crm_record: "CRM record",
  website: "Company website",
  unsupported: ""
};
