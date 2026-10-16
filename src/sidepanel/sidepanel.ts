/** Side panel for reps. The only page input is the active tab's URL and title.
 *  The central team decides which actions appear (assistant.config); reps
 *  sign in once and click. Setup of the workspace table is automatic. Runs in
 *  flight are tracked by the rep's rows, so closing the panel loses nothing. */
import { fetchSession, keySession, pollClaim, registerDevice, signInUrl, isDeeplineTab, type Connection, type PendingClaim } from "../background/auth";
import { KIND_GROUP, KIND_LABEL, pageContext, type PageContext } from "../shared/context";
import { AuthError, DEFAULT_BASE_URL, TERMINAL, connectedProviders, costLabel, inputFor, listPlays, playAvailable, maxCredits, normalizeBaseUrl, pollRun, query, startRun, type Credential, type PlaySummary } from "../shared/deepline";
import { CONFIG_SQL, DEFAULT_CONFIG, SETUP_SQL, finishSql, listSql, parseConfig, startSql, type AssistantConfig, type RecordRow } from "../shared/records";

declare const __EXTENSION_VERSION__: string;
const VERSION = typeof __EXTENSION_VERSION__ === "string" ? __EXTENSION_VERSION__ : "dev";
const POLL_MS = 3000;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
function h(tag: string, props: Record<string, unknown> = {}, ...kids: (Node | string | null)[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "on") for (const [ev, fn] of Object.entries(v as Record<string, EventListener>)) el.addEventListener(ev, fn);
    else if (k === "class") el.className = String(v);
    else if (v != null && v !== false) el.setAttribute(k, String(v));
  }
  for (const kid of kids) if (kid != null) el.append(kid);
  return el;
}

interface Stored {
  connection?: Connection | null;
  claim?: PendingClaim | null;
  ready?: string;
}
const store = {
  get: () => chrome.storage.local.get(null) as Promise<Stored>,
  set: (v: Partial<Stored>) => chrome.storage.local.set(v)
};

/** A team rolling this out with Chrome policy can point it at their Deepline; reps never see this. */
async function baseUrl(): Promise<string> {
  try {
    const managed = (await chrome.storage.managed.get("baseUrl")) as { baseUrl?: string };
    if (managed.baseUrl) return normalizeBaseUrl(managed.baseUrl);
  } catch {
    // No policy set.
  }
  return DEFAULT_BASE_URL;
}

const state = {
  baseUrl: DEFAULT_BASE_URL,
  cred: null as Credential | null,
  owner: null as string | null,
  needsSetup: false,
  config: DEFAULT_CONFIG as AssistantConfig,
  plays: [] as PlaySummary[],
  /** Integrations the workspace has connected; null until known (then nothing is hidden). */
  connected: null as Set<string> | null,
  ctx: pageContext(undefined),
  cap: DEFAULT_CONFIG.default_import_cap,
  rows: [] as RecordRow[],
  busy: new Set<string>(),
  polling: new Set<string>(),
  confirming: null as { play: PlaySummary; ctx: PageContext; credits: number } | null
};

/** Rep-facing wording for failures. The raw error goes to the console for whoever debugs it. */
function friendly(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  console.warn("[deepline-assistant]", msg);
  if (e instanceof AuthError) return "Signed out. Sign in to continue.";
  if (/credit|balance|insufficient|402/i.test(msg)) return "Out of credits. Ask your admin to add more.";
  if (/429|concurrency|too many/i.test(msg)) return "Busy. Try again in a moment.";
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return "Can't reach Deepline. Check your connection.";
  return "Something went wrong. Try again.";
}
function showError(e: unknown) {
  const box = $("error");
  if (!e) return void (box.hidden = true);
  box.textContent = friendly(e);
  box.hidden = false;
}

const rowKey = (r: Pick<RecordRow, "entity_key" | "play_key">) => `${r.entity_key}\u0000${r.play_key}`;
/** A configured play, with the team's rep-facing label applied. */
function findPlay(key: string): PlaySummary | undefined {
  const p = state.plays.find((x) => (x.playKey === key || x.playKey === `prebuilt/${key}`) && playAvailable(x, state.connected));
  const label = state.config.labels[key] ?? (p && state.config.labels[p.playKey]);
  return p && label ? { ...p, displayName: label } : p;
}
const playName = (key: string) => findPlay(key)?.displayName ?? key.replace(/^prebuilt\//, "").replace(/-/g, " ");
function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  return s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`;
}
const STATUS_LABEL: Record<string, string> = { queued: "starting", running: "working", waiting: "working", completed: "done", failed: "failed", cancelled: "stopped" };

/* ---------------------------------------------------------------- sign-in */

async function connect(): Promise<void> {
  const s = await store.get();
  state.baseUrl = await baseUrl();
  state.cred = null;
  state.owner = null;
  if (s.connection && s.connection.baseUrl === state.baseUrl) {
    const k = await keySession(s.connection, VERSION);
    if (k.revoked) await store.set({ connection: null });
    else {
      state.cred = { baseUrl: state.baseUrl, apiKey: s.connection.apiKey };
      state.owner = k.email ?? k.userId;
    }
  }
  if (!state.cred) {
    const session = await fetchSession(state.baseUrl);
    if (session.signedIn) {
      state.cred = { baseUrl: state.baseUrl, apiKey: null };
      state.owner = session.email ?? session.userId;
    }
  }
  $("who").textContent = state.owner ?? "";
  if (!state.cred) return void (s.claim ? waitForClaim(s.claim) : undefined);
  await Promise.all([
    setUp(s),
    listPlays(state.cred).then((p) => (state.plays = p)),
    connectedProviders(state.cred).then((c) => (state.connected = c), (e) => console.warn("[deepline-assistant] integration status unavailable", e))
  ]);
  if (!state.needsSetup) await loadRows();
}

let claiming = false;
async function waitForClaim(claim: PendingClaim) {
  if (claiming) return;
  claiming = true;
  $("claimNote").hidden = false;
  while (Date.now() < claim.expiresAt) {
    const r = await pollClaim(claim, VERSION);
    if (r.state === "claimed") {
      await store.set({ connection: r.connection, claim: null });
      break;
    }
    if (r.state !== "pending") break;
    await new Promise((res) => setTimeout(res, POLL_MS));
  }
  await store.set({ claim: null });
  $("claimNote").hidden = true;
  claiming = false;
  void boot();
}

/** Create the rep's table and the team config on first open, then read the config.
 *  Idempotent, so it is safe on every open; it only runs once per install. */
async function setUp(s: Stored) {
  const marker = `${state.baseUrl}|${state.owner}`;
  state.needsSetup = false;
  try {
    if (s.ready !== marker) {
      for (const sql of SETUP_SQL) await query(state.cred!, sql);
      await store.set({ ready: marker });
    }
    const [row] = await query<{ config: unknown }>(state.cred!, CONFIG_SQL);
    state.config = parseConfig(row?.config);
    state.cap = state.config.default_import_cap;
  } catch (e) {
    if (e instanceof AuthError) throw e;
    console.warn("[deepline-assistant] setup failed", e);
    state.needsSetup = true;
  }
}

/* ---------------------------------------------------------------- rows */

async function loadRows() {
  if (!state.cred || !state.owner) return;
  state.rows = await query<RecordRow>(state.cred, listSql(state.owner, 200), fetch, 200);
  render();
  for (const r of state.rows) if (!TERMINAL.has(r.status) && r.run_id) void track(r);
}

async function track(row: Pick<RecordRow, "owner" | "entity_key" | "play_key" | "run_id">) {
  const key = rowKey(row);
  if (state.polling.has(key) || !row.run_id) return;
  state.polling.add(key);
  try {
    for (;;) {
      const run = await pollRun(state.cred!, row.run_id);
      if (TERMINAL.has(run.status)) {
        await query(state.cred!, finishSql(row, run.status, run.result, run.error));
        break;
      }
      await new Promise((res) => setTimeout(res, POLL_MS));
    }
  } catch (e) {
    showError(e);
  } finally {
    state.polling.delete(key);
    await loadRows();
  }
}

/* ---------------------------------------------------------------- runs */

function requestRun(play: PlaySummary, ctx: PageContext) {
  const credits = maxCredits(play.cost, ctx.limit ?? 1);
  if (credits != null && credits > state.config.confirm_over_credits) {
    state.confirming = { play, ctx, credits };
    return render();
  }
  void run(play, ctx);
}

async function run(play: PlaySummary, ctx: PageContext) {
  state.confirming = null;
  if (!state.cred || !state.owner || !ctx.entity_key) return;
  const { input } = inputFor(play, ctx);
  const key = rowKey({ entity_key: ctx.entity_key, play_key: play.playKey });
  if (state.busy.has(key)) return;
  state.busy.add(key);
  render();
  const row = { owner: state.owner, entity_key: ctx.entity_key, play_key: play.playKey };
  try {
    // Intent first, so a crash between here and the run leaves a visible row.
    await query(state.cred, startSql(state.owner, ctx, play.playKey, null, "queued"));
    const started = await startRun(state.cred, play.playKey, input).catch(async (e) => {
      await query(state.cred!, finishSql(row, "failed", null, friendly(e)));
      throw e;
    });
    await query(state.cred, startSql(state.owner, ctx, play.playKey, started.runId, started.status));
    if (TERMINAL.has(started.status)) await query(state.cred, finishSql(row, started.status, started.result, started.error));
    else void track({ ...row, run_id: started.runId });
    showError(null);
  } catch (e) {
    showError(e);
  } finally {
    state.busy.delete(key);
    await loadRows();
  }
}

/* ---------------------------------------------------------------- render */

/** A found value with what it is, click to copy. Emails reach the table only when a provider verified them. */
const copyBtn = (v: string, what: string) => h("div", { class: "found" }, h("button", { class: "val", title: "Copy", on: { click: () => void copy(v) } }, v), h("span", { class: "muted" }, what));
async function copy(v: string) {
  await navigator.clipboard.writeText(v).catch(() => undefined);
}

/** The single priority action for what's on screen right now. */
interface Cta {
  label: string;
  meta?: string;
  disabled?: boolean;
  run: () => void;
}

/** Plays offered on this page, in the order the team chose, that the page can fill. */
function pageActions(ctx: PageContext): PlaySummary[] {
  const group = KIND_GROUP[ctx.kind];
  return (group ? state.config.actions[group] : []).map(findPlay).filter((p): p is PlaySummary => !!p && inputFor(p, ctx).missing.length === 0);
}

/** The team's handoffs that a finished result can feed. */
function handoffsFor(r: RecordRow): { play: PlaySummary; ctx: PageContext; done?: RecordRow }[] {
  if (r.status !== "completed" || state.config.handoffs.includes(r.play_key)) return [];
  const ctx: PageContext = { ...state.ctx, email: r.email ?? undefined, phone: r.phone ?? undefined };
  return state.config.handoffs
    .map(findPlay)
    .filter((p): p is PlaySummary => !!p && inputFor(p, ctx).missing.length === 0)
    .map((play) => ({ play, ctx, done: state.rows.find((x) => x.entity_key === r.entity_key && x.play_key === play.playKey) }));
}

const isBusy = (entity: string, play: string) => state.busy.has(rowKey({ entity_key: entity, play_key: play })) || state.rows.some((r) => r.entity_key === entity && r.play_key === play && !TERMINAL.has(r.status));

/** Pick the one thing the rep most needs to do here, and list the rest quietly. */
function plan(): { cta: Cta | null; others: { label: string; meta: string; run: () => void; disabled: boolean }[] } {
  if (!state.cred) return { cta: { label: "Sign in to Deepline", run: () => void chrome.tabs.create({ url: signInUrl(state.baseUrl) }) }, others: [] };
  if (state.needsSetup) return { cta: { label: "Copy note for admin", run: copyAdminNote }, others: [] };
  const c = state.confirming;
  if (c) return { cta: { label: "Go ahead", meta: `up to ${Math.round(c.credits)} credits`, run: () => void run(c.play, c.ctx) }, others: [] };
  const ctx: PageContext = { ...state.ctx, limit: KIND_GROUP[state.ctx.kind] === "search" ? state.cap : undefined };
  if (!ctx.entity_key) return { cta: { label: "Search your lookups", run: () => $("filter").focus() }, others: [] };
  const entity = ctx.entity_key;
  const actions = pageActions(ctx);
  const rows = state.rows.filter((r) => r.entity_key === entity);
  const search = KIND_GROUP[ctx.kind] === "search";
  const label = (p: PlaySummary) => (search ? `${p.displayName}: ${state.cap} people` : p.displayName);
  const item = (p: PlaySummary, x: PageContext = ctx) => ({ label: label(p), meta: costLabel(p.cost, x.limit ?? 1), disabled: isBusy(entity, p.playKey), run: () => requestRun(p, x) });

  const running = rows.find((r) => !TERMINAL.has(r.status)) ?? (actions.find((p) => state.busy.has(rowKey({ entity_key: entity, play_key: p.playKey }))) ? rows[0] : undefined);
  const fresh = actions.filter((p) => !rows.some((r) => r.play_key === p.playKey && r.status === "completed"));
  const result = rows.find((r) => r.status === "completed" && !state.config.handoffs.includes(r.play_key));
  const nextHandoff = result ? handoffsFor(result).find((x) => !x.done) : undefined;

  let cta: Cta | null = null;
  if (running || [...state.busy].some((k) => k.startsWith(`${entity}\u0000`))) cta = { label: "Working…", disabled: true, run: () => undefined };
  else if (nextHandoff) cta = { label: nextHandoff.play.displayName, meta: costLabel(nextHandoff.play.cost), run: () => requestRun(nextHandoff.play, nextHandoff.ctx) };
  else if (result?.email) cta = { label: "Copy email", meta: result.email, run: () => void copy(result.email!) };
  else if (fresh[0]) cta = item(fresh[0]);
  else if (actions[0]) cta = { ...item(actions[0]), label: `${actions[0].displayName} again` };

  const ctaPlay = cta && fresh[0] && cta.label === label(fresh[0]) ? fresh[0].playKey : null;
  const others = actions.filter((p) => p.playKey !== ctaPlay && !isBusy(entity, p.playKey)).map((p) => {
    const done = rows.some((r) => r.play_key === p.playKey && r.status === "completed");
    return { ...item(p), label: done ? `${p.displayName} again` : label(p) };
  });
  return { cta, others };
}

function rowItem(r: RecordRow, onPage: boolean): HTMLElement {
  const handoffNote = onPage
    ? handoffsFor(r)
        .filter((x) => x.done)
        .map((x) => h("span", { class: "muted" }, x.done!.status === "completed" ? `${x.play.displayName}: done ${ago(x.done!.updated_at)}` : `${x.play.displayName}: ${STATUS_LABEL[x.done!.status] ?? x.done!.status}`))
    : [];
  return h(
    "li",
    { class: "row" },
    h(
      "div",
      { class: "top" },
      onPage ? h("span", {}, playName(r.play_key)) : h("button", { class: "name", title: "Open this page", on: { click: () => r.url && void chrome.tabs.update({ url: r.url }) } }, r.label ?? "Saved lookup"),
      h("span", { class: `chip ${r.status}` }, STATUS_LABEL[r.status] ?? r.status)
    ),
    h("span", { class: "muted" }, onPage ? ago(r.updated_at) : `${playName(r.play_key)} · ${ago(r.updated_at)}`),
    r.email ? copyBtn(r.email, "verified") : null,
    r.phone ? copyBtn(r.phone, "phone") : null,
    r.status === "completed" && !r.email && !r.phone && /linkedin_person|salesnav_lead|crm_record/.test(r.kind ?? "") ? h("span", { class: "muted" }, "Nothing found. No charge.") : null,
    r.error ? h("span", { class: "err" }, r.error) : null,
    ...handoffNote
  );
}

function render() {
  const signedIn = !!state.cred;
  const ready = signedIn && !state.needsSetup;
  const ctx = state.ctx;
  $("connect").hidden = signedIn;
  $("setup").hidden = !signedIn || !state.needsSetup;
  $("page").hidden = !ready || !ctx.entity_key;
  $("idle").hidden = !ready || !!ctx.entity_key;
  $("table").hidden = !ready;
  $("disconnect").hidden = !signedIn;

  const { cta, others } = plan();
  $("ctaBar").hidden = !cta;
  if (cta) {
    $("ctaLabel").textContent = cta.label;
    $("ctaMeta").textContent = cta.meta ?? "";
    ($("cta") as HTMLButtonElement).disabled = !!cta.disabled;
    ctaRun = cta.run;
  }
  if (!ready) return;

  if (ctx.entity_key) {
    const kindLine = ctx.kind === "crm_record" ? `${ctx.crm_system === "hubspot" ? "HubSpot" : "Salesforce"} ${ctx.crm_object?.toLowerCase() ?? "record"}` : KIND_LABEL[ctx.kind];
    $("pageKind").textContent = ctx.label === kindLine ? "" : kindLine;
    $("pageKind").hidden = !$("pageKind").textContent;
    $("pageLabel").textContent = ctx.label;
    const pageRows = state.rows.filter((r) => r.entity_key === ctx.entity_key && !state.config.handoffs.includes(r.play_key));
    $("pageRows").replaceChildren(...(pageRows.length ? pageRows.map((r) => rowItem(r, true)) : [h("li", { class: "muted" }, "Not looked up yet")]));
    $("capRow").hidden = KIND_GROUP[ctx.kind] !== "search" || !pageActions(ctx).length;
    const c = state.confirming;
    $("confirm").hidden = !c;
    if (c) $("confirm").replaceChildren(h("b", {}, `Up to ${Math.round(c.credits)} credits`), h("span", { class: "muted" }, "You only pay for what's found."), h("button", { class: "link", on: { click: () => ((state.confirming = null), render()) } }, "Cancel"));
    $("more").hidden = !others.length || !!c;
    $("actions").replaceChildren(...others.map((o) => h("button", { class: "link", disabled: o.disabled, on: { click: o.run } }, h("span", {}, o.label), h("span", { class: "why" }, o.meta))));
    if (!pageActions(ctx).length && !state.rows.some((r) => r.entity_key === ctx.entity_key)) $("pageRows").replaceChildren(h("li", { class: "muted" }, "No actions for this page yet. Ask your admin."));
  }
  const q = ($("filter") as HTMLInputElement).value.trim().toLowerCase();
  const mine = state.rows.filter((r) => !state.config.handoffs.includes(r.play_key));
  const rows = q ? mine.filter((r) => [r.label, r.email, r.phone].some((v) => v?.toLowerCase().includes(q))) : mine;
  $("rows").replaceChildren(...rows.map((r) => rowItem(r, false)));
  $("empty").hidden = mine.length > 0;
}

let ctaRun: () => void = () => undefined;

function copyAdminNote() {
  const note = `Can you turn on the Deepline Assistant Chrome extension for our team? In Deepline, run the play "prebuilt/deepline-assistant-setup" once. (My account: ${state.owner ?? ""})`;
  void navigator.clipboard.writeText(note).then(() => ($("ctaLabel").textContent = "Copied"), () => undefined);
}

/* ---------------------------------------------------------------- tabs */

async function followTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const next = pageContext(tab?.url, tab?.title ?? "");
  if (next.entity_key !== state.ctx.entity_key) state.confirming = null;
  state.ctx = next;
  render();
}

chrome.tabs.onActivated.addListener(() => void followTab());
chrome.tabs.onUpdated.addListener((_id, info, tab) => {
  if (!tab.active) return;
  if (info.url || info.title) void followTab();
  // Signing in on Deepline in another tab connects the panel.
  if (info.status === "complete" && !state.cred && isDeeplineTab(tab.url, state.baseUrl)) void boot();
});

/* ---------------------------------------------------------------- wiring */

$("cta").addEventListener("click", () => ctaRun());
$("approve").addEventListener("click", async () => {
  try {
    const claim = await registerDevice(state.baseUrl, VERSION);
    await store.set({ claim });
    await chrome.tabs.create({ url: claim.claimUrl });
    void waitForClaim(claim);
  } catch (e) {
    showError(e);
  }
});
$("disconnect").addEventListener("click", async () => {
  await store.set({ connection: null, claim: null, ready: undefined });
  void boot();
});
$("retrySetup").addEventListener("click", async () => {
  await store.set({ ready: undefined });
  void boot();
});
$("refresh").addEventListener("click", () => void loadRows().catch(showError));
$("filter").addEventListener("input", render);
$("cap").addEventListener("input", (e) => {
  const n = Math.floor(Number((e.target as HTMLInputElement).value));
  if (n > 0) state.cap = Math.min(n, 1000);
  render();
});

async function boot() {
  showError(null);
  try {
    await followTab();
    await connect();
  } catch (e) {
    if (e instanceof AuthError) state.cred = null;
    showError(e);
  }
  ($("cap") as HTMLInputElement).value = String(state.cap);
  render();
}
void boot();
