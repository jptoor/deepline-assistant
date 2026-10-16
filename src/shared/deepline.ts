/** Deepline API client: list plays, fill a play's input from page context,
 *  run it, read its status and outputs, and query the workspace database.
 *  Every call takes a fetch implementation so it can be unit-tested. */
import type { PageContext } from "./context";

export const DEFAULT_BASE_URL = "https://code.deepline.com";
export const TERMINAL = new Set(["completed", "failed", "cancelled"]);

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** API key (device connection) or browser session (cookies). */
export interface Credential {
  baseUrl: string;
  apiKey: string | null;
}

export interface PlaySummary {
  playKey: string;
  displayName: string;
  description: string | null;
  origin: string;
  fields: string[];
  required: string[];
  /** Keys a declared `context` object accepts; null = any. */
  contextFields: string[] | null;
  /** Credits per run (or per row for row-unit plays), when Deepline can estimate it. */
  cost: { low: number; high: number; perRow: boolean } | null;
}

/** "~3 credits", "1–4 credits", "cost varies". Per-row plays scale by the rep's cap. */
export function costLabel(cost: PlaySummary["cost"], rows = 1): string {
  if (!cost) return "cost varies";
  const k = cost.perRow ? rows : 1;
  const lo = Math.round(cost.low * k), hi = Math.round(cost.high * k);
  if (hi === 0) return "free";
  return lo === hi ? `~${hi} credit${hi === 1 ? "" : "s"}` : `${lo}–${hi} credits`;
}
export function maxCredits(cost: PlaySummary["cost"], rows = 1): number | null {
  return cost ? cost.high * (cost.perRow ? rows : 1) : null;
}

/** Context fields keyed by the input names plays commonly declare. The first
 *  matching alias wins, so a play only ever receives fields it declared. */
const ALIASES: Record<string, (c: PageContext) => unknown> = {
  linkedin_url: (c) => c.linkedin_url ?? c.sales_navigator_url,
  linkedin: (c) => c.linkedin_url ?? c.sales_navigator_url,
  linkedin_profile_url: (c) => c.linkedin_url,
  contact_linkedin: (c) => c.linkedin_url,
  sales_navigator_url: (c) => c.sales_navigator_url,
  company_linkedin_url: (c) => c.company_linkedin_url,
  linkedin_company_url: (c) => c.company_linkedin_url,
  company_linkedin: (c) => c.company_linkedin_url,
  search_url: (c) => c.search_url,
  sales_nav_url: (c) => c.search_url,
  domain: (c) => c.domain,
  company_domain: (c) => c.domain,
  website: (c) => c.domain,
  full_name: (c) => c.full_name,
  name: (c) => c.full_name ?? c.company_name,
  contact_full_name: (c) => c.full_name,
  first_name: (c) => c.first_name,
  last_name: (c) => c.last_name,
  company_name: (c) => c.company_name,
  company: (c) => c.company_name,
  crm_system: (c) => c.crm_system,
  crm_object: (c) => c.crm_object,
  crm_id: (c) => c.crm_id,
  record_id: (c) => c.crm_id,
  url: (c) => c.linkedin_url ?? c.search_url ?? c.url,
  page_url: (c) => c.url,
  entity_key: (c) => c.entity_key,
  email: (c) => c.email,
  work_email: (c) => c.email,
  professional_email: (c) => c.email,
  phone: (c) => c.phone,
  limit: (c) => c.limit,
  max_results: (c) => c.limit,
  max_people: (c) => c.limit,
  // A play that declares `context` gets the whole object.
  context: (c) => c
};

/** Input for a play from page context: declared fields only, plus the
 *  required fields this page cannot fill (the button says why it is off). */
export function inputFor(play: Pick<PlaySummary, "fields" | "required"> & { contextFields?: string[] | null }, ctx: PageContext): { input: Record<string, unknown>; missing: string[] } {
  const input: Record<string, unknown> = {};
  for (const f of play.fields) {
    let v = ALIASES[f]?.(ctx);
    // Strict plays reject unknown keys, so a context object carries only the declared ones.
    if (f === "context" && play.contextFields) v = Object.fromEntries(Object.entries(ctx).filter(([k]) => play.contextFields!.includes(k)));
    if (v != null && v !== "") input[f] = v;
  }
  return { input, missing: play.required.filter((f) => !(f in input)) };
}

export function normalizeBaseUrl(raw: string): string {
  const u = new URL(raw.trim() || DEFAULT_BASE_URL);
  if (u.username || u.password) throw new Error("Base URL must not contain credentials");
  if (u.protocol !== "https:" && !(u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1"))) throw new Error("Base URL must use https:// (http:// only for localhost)");
  return `${u.protocol}//${u.host}`;
}

export function apiInit(apiKey: string | null | undefined, extra: RequestInit = {}): RequestInit {
  const headers: Record<string, string> = { Accept: "application/json", ...((extra.headers as Record<string, string>) ?? {}) };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return { ...extra, headers, credentials: apiKey ? "omit" : "include", redirect: "error", cache: "no-store" };
}

export class AuthError extends Error {}

async function call<T>(cred: Credential, path: string, fetchImpl: FetchLike, body?: unknown): Promise<T> {
  const init = body === undefined ? apiInit(cred.apiKey) : apiInit(cred.apiKey, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
  const res = await fetchImpl(`${normalizeBaseUrl(cred.baseUrl)}${path}`, init);
  if (res.status === 401 || res.status === 403) throw new AuthError("Not signed in to Deepline");
  const json = (await res.json().catch(() => null)) as T & { error?: unknown };
  if (!res.ok) throw new Error(typeof json?.error === "string" ? json.error : `Deepline responded ${res.status}`);
  return json;
}

function schemaFields(schema: unknown): { fields: string[]; required: string[]; contextFields: string[] | null } {
  const s = schema && typeof schema === "object" ? (schema as { properties?: Record<string, { properties?: unknown }>; required?: unknown }) : {};
  const props = s.properties && typeof s.properties === "object" ? s.properties : {};
  const required = Array.isArray(s.required) ? s.required.filter((r): r is string => typeof r === "string") : [];
  const nested = props.context?.properties;
  return { fields: Object.keys(props), required, contextFields: nested && typeof nested === "object" ? Object.keys(nested) : null };
}

export function toSummary(p: Record<string, unknown>): PlaySummary | null {
  const playKey = typeof p.playKey === "string" ? p.playKey : typeof p.reference === "string" ? p.reference : null;
  if (!playKey) return null;
  const est = (p.costEstimate ?? null) as { status?: string; lowCredits?: number; highCredits?: number; unit?: string } | null;
  const cost = est?.status === "available" && typeof est.highCredits === "number" ? { low: est.lowCredits ?? est.highCredits, high: est.highCredits, perRow: est.unit === "row" } : null;
  return {
    playKey,
    displayName: typeof p.displayName === "string" && p.displayName ? p.displayName : playKey,
    description: typeof p.description === "string" ? p.description : null,
    origin: typeof p.origin === "string" ? p.origin : "owned",
    ...schemaFields(p.inputSchema),
    cost
  };
}

/** The workspace's own plays first, then Deepline's prebuilt ones. */
export async function listPlays(cred: Credential, fetchImpl: FetchLike = fetch): Promise<PlaySummary[]> {
  const out: PlaySummary[] = [];
  for (const origin of ["owned", "prebuilt"]) {
    const json = await call<{ plays?: unknown[] }>(cred, `/api/v2/plays?origin=${origin}&limit=100&include_cost_estimates=1`, fetchImpl);
    for (const p of json.plays ?? []) {
      const s = p && typeof p === "object" ? toSummary(p as Record<string, unknown>) : null;
      if (s && !out.some((o) => o.playKey === s.playKey)) out.push({ ...s, origin });
    }
  }
  return out;
}

export interface RunState {
  runId: string | null;
  status: string;
  /** Output values when the run is terminal (dataset outputs are referenced, not inlined). */
  result: Record<string, unknown> | null;
  error: string | null;
}

function runStateFrom(json: Record<string, unknown>): RunState {
  const run = (json.run ?? {}) as Record<string, unknown>;
  const runId = typeof run.id === "string" ? run.id : typeof json.runId === "string" ? json.runId : null;
  const status = String(run.status ?? json.status ?? "queued");
  const outputs = json.outputs && typeof json.outputs === "object" ? (json.outputs as Record<string, { kind?: string; value?: unknown; dataset?: string; rowCount?: number }>) : {};
  const result: Record<string, unknown> = {};
  for (const [k, o] of Object.entries(outputs)) result[k] = o?.kind === "value" ? o.value : { dataset: o?.dataset, rows: o?.rowCount };
  const err = run.error ?? json.error;
  return { runId, status, result: Object.keys(result).length ? result : null, error: typeof err === "string" ? err : err ? JSON.stringify(err) : null };
}

/** Start a run and wait up to 15 s server-side; longer runs are polled. */
export async function startRun(cred: Credential, playKey: string, input: Record<string, unknown>, fetchImpl: FetchLike = fetch): Promise<RunState> {
  return runStateFrom(await call<Record<string, unknown>>(cred, "/api/v2/plays/run", fetchImpl, { name: playKey, input, waitForCompletionMs: 15_000 }));
}

/** Constant-size status poll; fetches the run package only once it is terminal. */
export async function pollRun(cred: Credential, runId: string, fetchImpl: FetchLike = fetch): Promise<RunState> {
  const id = encodeURIComponent(runId);
  const s = await call<{ available?: boolean; lifecycle?: { status?: string } }>(cred, `/api/v2/runs/${id}/status`, fetchImpl);
  const status = s.available ? String(s.lifecycle?.status ?? "running") : "queued";
  if (!TERMINAL.has(status)) return { runId, status, result: null, error: null };
  return { ...runStateFrom(await call<Record<string, unknown>>(cred, `/api/v2/runs/${id}?billing=false`, fetchImpl)), runId, status };
}

/** One SQL statement against the workspace database (`deepline db query`). */
export async function query<R = Record<string, unknown>>(cred: Credential, sql: string, fetchImpl: FetchLike = fetch, maxRows = 100): Promise<R[]> {
  const json = await call<{ rows?: R[] }>(cred, "/api/v2/db/query", fetchImpl, { sql, max_rows: maxRows });
  return json.rows ?? [];
}
