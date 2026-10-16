// Preview stub for screenshots: fakes the chrome.* APIs and Deepline responses
// so the real built panel renders one named state. Never shipped (pack checks dist/ only).
(() => {
  const params = new URLSearchParams(location.search);
  const name = params.get("state") || "person-new";
  const OWNER = "jai@acme.io";
  const now = Date.now();
  const iso = (minsAgo) => new Date(now - minsAgo * 60000).toISOString();
  const schema = (fields, req = []) => ({ type: "object", properties: Object.fromEntries(fields.map((f) => [f, { type: "string" }])), required: req });
  const cost = (low, high, unit = "run") => ({ status: "available", source: "observed", unit, lowCredits: low, highCredits: high });
  const PLAYS = [
    { playKey: "prebuilt/deepline-assistant", displayName: "Deepline Assistant: email + phone", inputSchema: { type: "object", required: ["context"], properties: { context: { type: "object", properties: Object.fromEntries(["kind", "url", "linkedin_url", "sales_navigator_url", "first_name", "last_name", "full_name", "company_name"].map((k) => [k, { type: "string" }])) } } }, costEstimate: cost(3, 3) },
    { playKey: "prebuilt/job-change-check", displayName: "Job change check", inputSchema: schema(["linkedin_url", "full_name", "company_domain"]), costEstimate: cost(1, 1) },
    { playKey: "find-buyers", displayName: "find-buyers", inputSchema: schema(["domain", "company_linkedin_url"]), costEstimate: cost(6, 6) },
    { playKey: "company-profile", displayName: "company-profile", inputSchema: schema(["domain", "company_linkedin_url"]), costEstimate: cost(1, 1) },
    { playKey: "search-import", displayName: "search-import", inputSchema: schema(["search_url", "limit"], ["search_url"]), costEstimate: cost(2, 3, "row") },
    { playKey: "crm-fill", displayName: "crm-fill", inputSchema: schema(["crm_system", "crm_object", "crm_id"], ["crm_id"]), costEstimate: cost(3, 3) },
    { playKey: "add-to-hubspot", displayName: "add-to-hubspot", inputSchema: schema(["linkedin_url", "email", "first_name", "last_name"], ["email"]), costEstimate: cost(0, 0), providers: ["hubspot"] },
    { playKey: "add-to-lemlist", displayName: "add-to-lemlist", inputSchema: schema(["email", "first_name"], ["email"]), costEstimate: cost(0, 0), providers: ["lemlist"] }
  ];
  const CONFIG = {
    actions: { person: ["prebuilt/deepline-assistant", "prebuilt/job-change-check"], company: ["find-buyers", "company-profile"], search: ["search-import"], crm: ["crm-fill"] },
    handoffs: ["add-to-hubspot", "add-to-lemlist"],
    labels: { "prebuilt/deepline-assistant": "Find email + phone", "prebuilt/job-change-check": "Check for a job change", "find-buyers": "Find VP Sales + RevOps", "company-profile": "Company details", "search-import": "Import and enrich", "crm-fill": "Fill missing email + phone", "add-to-hubspot": "Add to HubSpot", "add-to-lemlist": "Add to Q4 lemlist" },
    confirm_over_credits: 25,
    default_import_cap: 25
  };
  const PROFILE = { url: "https://www.linkedin.com/in/maya-okafor-4b1/", title: "(2) Maya Okafor | LinkedIn" };
  const maya = (play, status, extra = {}) => ({ owner: OWNER, entity_key: "linkedin:in:maya-okafor-4b1", play_key: play, kind: "linkedin_person", label: "Maya Okafor", url: PROFILE.url, run_id: "run_1", status, email: null, phone: null, result: null, error: null, updated_at: iso(2), ...extra });
  const found = (mins = 2) => maya("prebuilt/deepline-assistant", "completed", { email: "maya@northwind.io", phone: "+1 415 555 0142", updated_at: iso(mins) });
  const others = [
    { owner: OWNER, entity_key: "linkedin:in:priya-shah", play_key: "prebuilt/deepline-assistant", kind: "linkedin_person", label: "Priya Shah", url: "https://www.linkedin.com/in/priya-shah/", run_id: "run_2", status: "completed", email: "priya@lumen.co", phone: null, result: null, error: null, updated_at: iso(14) },
    { owner: OWNER, entity_key: "search:x", play_key: "search-import", kind: "salesnav_search", label: "Sales Navigator search", url: "https://www.linkedin.com/sales/search/people?query=x", run_id: "run_3", status: "completed", email: null, phone: null, result: { people: 25 }, error: null, updated_at: iso(60 * 5) },
    { owner: OWNER, entity_key: "linkedin:in:leo-martins", play_key: "prebuilt/deepline-assistant", kind: "linkedin_person", label: "Leo Martins", url: "https://www.linkedin.com/in/leo-martins/", run_id: "run_4", status: "failed", email: null, phone: null, result: null, error: "A data provider timed out. You weren't charged.", updated_at: iso(60 * 26) }
  ];
  const STATES = {
    "signed-out": { tab: PROFILE, signedIn: false },
    "setup-needed": { tab: PROFILE, setupFails: true },
    "person-new": { tab: PROFILE, rows: [] },
    "person-working": { tab: PROFILE, rows: [maya("prebuilt/deepline-assistant", "running")], running: true },
    "person-found-handoff": { tab: PROFILE, rows: [found()] },
    "person-handoff-done": { tab: PROFILE, rows: [found(6), maya("add-to-hubspot", "completed", { updated_at: iso(1) })] },
    "person-found-copy": { tab: PROFILE, rows: [found(60 * 24 * 12)], config: { handoffs: [] } },
    "person-nothing": { tab: PROFILE, rows: [maya("prebuilt/deepline-assistant", "completed")] },
    "salesnav-lead": { tab: { url: "https://www.linkedin.com/sales/lead/ACwAAB3kQ9sZx1,NAME_SEARCH,Ab12", title: "Sam Lee | Sales Navigator" }, rows: [] },
    "company": { tab: { url: "https://www.northwind.io/pricing", title: "Pricing - Northwind" }, rows: [] },
    "search": { tab: { url: "https://www.linkedin.com/sales/search/people?query=(filters%3AList((type%3ACURRENT_TITLE)))", title: "Sales Navigator" }, rows: [] },
    "search-confirm": { tab: { url: "https://www.linkedin.com/sales/search/people?query=(filters%3AList((type%3ACURRENT_TITLE)))", title: "Sales Navigator" }, rows: [], click: true },
    "crm": { tab: { url: "https://acme.lightning.force.com/lightning/r/Contact/003Ak00000ABCDeIAX/view", title: "Maya Okafor | Salesforce" }, rows: [] },
    "lookups": { tab: { url: "https://mail.google.com/mail/u/0/#inbox", title: "Inbox (3) - jai@acme.io - Gmail" }, rows: [found(), ...others] },
    "crm-not-connected": { tab: PROFILE, rows: [found()], disconnected: ["hubspot"] },
    "no-actions": { tab: PROFILE, rows: [], config: { actions: { person: [], company: [], search: [], crm: [] } } }
  };
  const st = STATES[name];
  if (!st) throw new Error(`unknown preview state ${name}`);
  const config = { ...CONFIG, ...(st.config ?? {}) };
  const local = {};
  const noop = () => undefined;
  const ev = { addListener: noop };
  window.chrome = {
    storage: { local: { get: async () => ({ ...local }), set: async (v) => Object.assign(local, v) }, managed: { get: async () => ({}) } },
    tabs: { query: async () => [{ ...st.tab, active: true, id: 1 }], create: async () => ({}), update: async () => ({}), onActivated: ev, onUpdated: ev },
    sidePanel: { setPanelBehavior: async () => undefined }
  };
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  window.fetch = async (url, init = {}) => {
    const u = new URL(url);
    const body = init.body ? JSON.parse(init.body) : {};
    if (u.pathname === "/api/v2/auth/session") return json({ session: st.signedIn === false ? null : { user: { id: "u1", email: OWNER, name: "Jai" } } });
    if (u.pathname === "/api/v2/plays") return json({ plays: u.searchParams.get("origin") === "owned" ? PLAYS.filter((p) => !p.playKey.startsWith("prebuilt/")) : PLAYS.filter((p) => p.playKey.startsWith("prebuilt/")) });
    if (u.pathname === "/api/v2/db/query") {
      const sql = String(body.sql);
      if (/^CREATE|^INSERT INTO assistant\.config/.test(sql)) return st.setupFails ? json({ error: "permission denied for schema" }, 500) : json({ rows: [] });
      if (sql.startsWith("SELECT config")) return json({ rows: [{ config }] });
      if (sql.startsWith("SELECT")) return json({ rows: st.rows ?? [] });
      return json({ rows: [] });
    }
    if (u.pathname === "/api/v2/integrations/list") return json({ integrations: ["hubspot", "lemlist", "salesforce"].map((provider) => ({ provider, connection: { connected: !(st.disconnected ?? []).includes(provider) } })) });
    if (u.pathname.endsWith("/status")) return json({ available: true, lifecycle: { status: "running" } });
    return json({}, 404);
  };
  if (st.click) window.addEventListener("load", () => setTimeout(() => document.getElementById("cta")?.click(), 400));
})();
