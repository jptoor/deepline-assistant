/** Side panel. The only page input is the active tab's URL and title; plays
 *  do the work in Deepline and their results live in the rep's table
 *  (assistant.records). Runs in flight are tracked by that table, so closing
 *  the panel loses nothing: the next open reconciles every pending row. */
import { fetchSession, keySession, pollClaim, registerDevice, signInUrl, isDeeplineTab, type Connection, type PendingClaim } from "../background/auth";
import { KIND_LABEL, pageContext } from "../shared/context";
import { AuthError, DEFAULT_BASE_URL, TERMINAL, inputFor, listPlays, normalizeBaseUrl, pollRun, query, startRun, type Credential, type PlaySummary } from "../shared/deepline";
import { SETUP_SQL, finishSql, listSql, startSql, type RecordRow } from "../shared/records";

declare const __EXTENSION_VERSION__: string;
const VERSION = typeof __EXTENSION_VERSION__ === "string" ? __EXTENSION_VERSION__ : "dev";
const POLL_MS = 3000;
const SHOWN_PLAYS = 4;

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
  baseUrl?: string;
  connection?: Connection | null;
  claim?: PendingClaim | null;
  tableReady?: string;
  pinned?: string[];
}
const store = {
  get: () => chrome.storage.local.get(null) as Promise<Stored>,
  set: (v: Partial<Stored>) => chrome.storage.local.set(v)
};

const state = {
  baseUrl: DEFAULT_BASE_URL,
  cred: null as Credential | null,
  owner: null as string | null,
  plays: [] as PlaySummary[],
  pinned: [] as string[],
  ctx: pageContext(undefined),
  rows: [] as RecordRow[],
  busy: new Set<string>(),
  polling: new Set<string>()
};

function showError(e: unknown) {
  const box = $("error");
  if (!e) return void (box.hidden = true);
  box.textContent = e instanceof Error ? e.message : String(e);
  box.hidden = false;
}

const rowKey = (r: Pick<RecordRow, "entity_key" | "play_key">) => `${r.entity_key}\u0000${r.play_key}`;
const playName = (key: string) => state.plays.find((p) => p.playKey === key)?.displayName ?? key.replace(/^prebuilt\//, "");
function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  return s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`;
}

/* ---------------------------------------------------------------- auth */

async function connect(): Promise<void> {
  const s = await store.get();
  state.baseUrl = s.baseUrl ?? DEFAULT_BASE_URL;
  state.pinned = s.pinned ?? [];
  ($("baseUrl") as HTMLInputElement).value = state.baseUrl;
  state.cred = null;
  state.owner = null;
  if (s.connection && s.connection.baseUrl === normalizeBaseUrl(state.baseUrl)) {
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
  await Promise.all([ensureTable(s), loadPlays()]);
  await loadRows();
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
      $("claimNote").hidden = true;
      claiming = false;
      return void boot();
    }
    if (r.state !== "pending") break;
    await new Promise((res) => setTimeout(res, POLL_MS));
  }
  await store.set({ claim: null });
  $("claimNote").hidden = true;
  claiming = false;
}

/** Create the rep's table once per workspace + URL. Idempotent DDL. */
async function ensureTable(s: Stored) {
  const marker = `${state.baseUrl}|${state.owner}`;
  if (s.tableReady === marker) return;
  for (const sql of SETUP_SQL) await query(state.cred!, sql);
  await store.set({ tableReady: marker });
}

async function loadPlays() {
  state.plays = await listPlays(state.cred!);
}

/* ---------------------------------------------------------------- table */

async function loadRows() {
  if (!state.cred || !state.owner) return;
  state.rows = await query<RecordRow>(state.cred, listSql(state.owner, 200), fetch, 200);
  render();
  for (const r of state.rows) if (!TERMINAL.has(r.status) && r.run_id) void track(r);
}

/** Poll one pending row's run until it is terminal, then write the result. */
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

async function run(play: PlaySummary) {
  const ctx = state.ctx;
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
      await query(state.cred!, finishSql(row, "failed", null, e instanceof Error ? e.message : String(e)));
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

function rowItem(r: RecordRow, showEntity: boolean): HTMLElement {
  const copy = (v: string) => h("button", { class: "val", title: "Copy", on: { click: () => void navigator.clipboard.writeText(v) } }, v);
  return h(
    "li",
    { class: "row" },
    h(
      "div",
      { class: "top" },
      showEntity ? h("button", { class: "name", title: r.url ?? "", on: { click: () => r.url && void chrome.tabs.update({ url: r.url }) } }, r.label ?? r.entity_key) : h("span", {}, playName(r.play_key)),
      h("span", { class: `chip ${r.status}` }, r.status)
    ),
    showEntity ? h("span", { class: "small muted" }, `${playName(r.play_key)} · ${ago(r.updated_at)}`) : h("span", { class: "small muted" }, ago(r.updated_at)),
    r.email ? copy(r.email) : null,
    r.phone ? copy(r.phone) : null,
    r.error ? h("span", { class: "err" }, r.error) : null
  );
}

function renderActions() {
  const ctx = state.ctx;
  const filter = ($("playFilter") as HTMLInputElement).value.trim().toLowerCase();
  const usable = state.plays
    .map((p) => ({ p, ...inputFor(p, ctx) }))
    .filter((x) => x.missing.length === 0 && Object.keys(x.input).length > 0)
    .sort((a, b) => Number(state.pinned.includes(b.p.playKey)) - Number(state.pinned.includes(a.p.playKey)));
  const shown = filter ? usable.filter((x) => `${x.p.displayName} ${x.p.playKey}`.toLowerCase().includes(filter)) : usable.slice(0, SHOWN_PLAYS);
  $("morePlays").hidden = usable.length <= SHOWN_PLAYS;
  const done = new Map(state.rows.filter((r) => r.entity_key === ctx.entity_key).map((r) => [r.play_key, r]));
  $("actions").replaceChildren(
    ...shown.map(({ p }, i) => {
      const prior = done.get(p.playKey);
      const busy = state.busy.has(rowKey({ entity_key: ctx.entity_key!, play_key: p.playKey })) || (prior && !TERMINAL.has(prior.status));
      const pinned = state.pinned.includes(p.playKey);
      return h(
        "div",
        { style: "display:flex;gap:6px" },
        h("button", { class: `btn${i === 0 && !filter ? " primary" : ""}`, disabled: busy, title: p.description ?? p.playKey, on: { click: () => void run(p) } }, h("span", {}, busy ? `Running ${p.displayName}…` : p.displayName), h("span", { class: "why" }, prior?.status === "completed" ? "Run again" : p.origin === "prebuilt" ? "Deepline" : "Your play")),
        h("button", { class: "link", "aria-pressed": pinned, title: pinned ? "Unpin" : "Pin to top", on: { click: () => void togglePin(p.playKey) } }, pinned ? "★" : "☆")
      );
    })
  );
  if (!usable.length) $("actions").replaceChildren(h("p", { class: "small muted" }, "No play in this workspace accepts this page. Publish a play whose input declares one of: linkedin_url, company_linkedin_url, search_url, domain, crm_id, or context."));
}

async function togglePin(key: string) {
  state.pinned = state.pinned.includes(key) ? state.pinned.filter((k) => k !== key) : [key, ...state.pinned];
  await store.set({ pinned: state.pinned });
  render();
}

function render() {
  const signedIn = !!state.cred;
  const ctx = state.ctx;
  $("connect").hidden = signedIn;
  $("page").hidden = !signedIn || !ctx.entity_key;
  $("idle").hidden = !signedIn || !!ctx.entity_key;
  $("table").hidden = !signedIn;
  if (!signedIn) return;
  if (ctx.entity_key) {
    $("pageKind").textContent = KIND_LABEL[ctx.kind];
    $("pageLabel").textContent = ctx.label;
    $("pageRows").replaceChildren(...state.rows.filter((r) => r.entity_key === ctx.entity_key).map((r) => rowItem(r, false)));
    renderActions();
  }
  const q = ($("filter") as HTMLInputElement).value.trim().toLowerCase();
  const rows = q ? state.rows.filter((r) => [r.label, r.email, r.phone, r.play_key, r.entity_key].some((v) => v?.toLowerCase().includes(q))) : state.rows;
  $("rows").replaceChildren(...rows.map((r) => rowItem(r, true)));
  $("empty").hidden = state.rows.length > 0;
}

/* ---------------------------------------------------------------- tabs */

async function followTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  state.ctx = pageContext(tab?.url, tab?.title ?? "");
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

$("signIn").addEventListener("click", () => void chrome.tabs.create({ url: signInUrl(state.baseUrl) }));
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
  await store.set({ connection: null, claim: null });
  void boot();
});
$("baseUrl").addEventListener("change", async (e) => {
  try {
    const baseUrl = normalizeBaseUrl((e.target as HTMLInputElement).value);
    // A local Deepline needs its origin granted; production is in host_permissions.
    if (!baseUrl.startsWith("https://code.deepline.com") && !(await chrome.permissions.request({ origins: [`${baseUrl}/*`] }))) throw new Error(`Allow access to ${baseUrl} to use it`);
    await store.set({ baseUrl, connection: null });
    void boot();
  } catch (err) {
    showError(err);
  }
});
$("refresh").addEventListener("click", () => void loadRows().catch(showError));
$("filter").addEventListener("input", render);
$("playFilter").addEventListener("input", renderActions);

async function boot() {
  showError(null);
  try {
    await followTab();
    await connect();
  } catch (e) {
    if (e instanceof AuthError) state.cred = null;
    showError(e);
  }
  render();
}
void boot();
