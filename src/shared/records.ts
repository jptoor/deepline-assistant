/** The rep's table: one row per (rep, page entity, play) in the workspace
 *  database, so results live in Deepline, survive reinstalls, and are
 *  visible to the team's plays and SQL. The panel only renders these rows.
 *  The query endpoint takes one statement with no bind parameters, so every
 *  value goes through `lit`. */
import type { PageContext } from "./context";

export const TABLE = "assistant.records";
export const CONFIG_TABLE = "assistant.config";

/** What the central team decides, so reps never configure anything: which
 *  actions appear on which kind of page, which plays hand a finished result
 *  off (CRM, sequence), and when a run needs a confirm. One row per workspace,
 *  written by the setup play or created with these defaults on first open. */
export interface AssistantConfig {
  actions: { person: string[]; company: string[]; search: string[]; crm: string[] };
  handoffs: string[];
  /** What reps see on the button, keyed by play: "Find email + phone". */
  labels: Record<string, string>;
  confirm_over_credits: number;
  default_import_cap: number;
}
export const DEFAULT_CONFIG: AssistantConfig = {
  actions: { person: ["prebuilt/deepline-assistant", "prebuilt/job-change-check"], company: [], search: [], crm: [] },
  handoffs: [],
  labels: { "prebuilt/deepline-assistant": "Find email + phone", "prebuilt/job-change-check": "Check for a job change" },
  confirm_over_credits: 25,
  default_import_cap: 25
};

/** Missing keys fall back to the defaults; a malformed row never blanks the panel. */
export function parseConfig(raw: unknown): AssistantConfig {
  const c = (raw && typeof raw === "object" ? raw : {}) as Partial<AssistantConfig>;
  const list = (v: unknown, d: string[]) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : d);
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : d);
  const a = (c.actions ?? {}) as Partial<AssistantConfig["actions"]>;
  const d = DEFAULT_CONFIG;
  return {
    actions: { person: list(a.person, d.actions.person), company: list(a.company, d.actions.company), search: list(a.search, d.actions.search), crm: list(a.crm, d.actions.crm) },
    handoffs: list(c.handoffs, d.handoffs),
    labels: c.labels && typeof c.labels === "object" ? Object.fromEntries(Object.entries(c.labels).filter((e): e is [string, string] => typeof e[1] === "string" && !!e[1].trim())) : d.labels,
    confirm_over_credits: num(c.confirm_over_credits, d.confirm_over_credits),
    default_import_cap: num(c.default_import_cap, d.default_import_cap)
  };
}

export const CONFIG_SQL = `SELECT config FROM ${CONFIG_TABLE} WHERE id = 'default'`;

export const SETUP_SQL = [
  "CREATE SCHEMA IF NOT EXISTS assistant",
  `CREATE TABLE IF NOT EXISTS ${TABLE} (
  owner text NOT NULL,
  entity_key text NOT NULL,
  play_key text NOT NULL,
  kind text,
  label text,
  url text,
  run_id text,
  status text NOT NULL,
  email text,
  phone text,
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner, entity_key, play_key)
)`,
  `CREATE INDEX IF NOT EXISTS records_owner_updated ON ${TABLE} (owner, updated_at DESC)`,
  `CREATE TABLE IF NOT EXISTS ${CONFIG_TABLE} (id text PRIMARY KEY, config jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`,
  `INSERT INTO ${CONFIG_TABLE} (id, config) VALUES ('default', '${JSON.stringify(DEFAULT_CONFIG)}'::jsonb) ON CONFLICT (id) DO NOTHING`
];

export interface RecordRow {
  owner: string;
  entity_key: string;
  play_key: string;
  kind: string | null;
  label: string | null;
  url: string | null;
  run_id: string | null;
  status: string;
  email: string | null;
  phone: string | null;
  result: unknown;
  error: string | null;
  updated_at: string;
}

export const lit = (v: unknown): string => (v == null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const COLS = "owner, entity_key, play_key, kind, label, url, run_id, status, email, phone, result, error, updated_at";

export function listSql(owner: string, limit = 100): string {
  return `SELECT ${COLS} FROM ${TABLE} WHERE owner = ${lit(owner)} ORDER BY updated_at DESC LIMIT ${Math.max(1, Math.min(1000, Math.floor(limit)))}`;
}

/** Row written when a run starts: the durable pending set the panel reconciles. */
export function startSql(owner: string, ctx: PageContext, playKey: string, runId: string | null, status: string): string {
  return `INSERT INTO ${TABLE} (owner, entity_key, play_key, kind, label, url, run_id, status)
VALUES (${[owner, ctx.entity_key, playKey, ctx.kind, ctx.label, ctx.url, runId, status].map(lit).join(", ")})
ON CONFLICT (owner, entity_key, play_key) DO UPDATE SET run_id = EXCLUDED.run_id, status = EXCLUDED.status, label = EXCLUDED.label, url = EXCLUDED.url, error = NULL, updated_at = now()`;
}

export function finishSql(row: Pick<RecordRow, "owner" | "entity_key" | "play_key">, status: string, result: unknown, error: string | null): string {
  const { email, phone } = contactFields(result);
  return `UPDATE ${TABLE} SET status = ${lit(status)}, result = ${result == null ? "NULL" : `${lit(JSON.stringify(result))}::jsonb`}, error = ${lit(error)}, email = COALESCE(${lit(email)}, email), phone = COALESCE(${lit(phone)}, phone), updated_at = now()
WHERE owner = ${lit(row.owner)} AND entity_key = ${lit(row.entity_key)} AND play_key = ${lit(row.play_key)}`;
}

/** First email- and phone-looking strings in a play result (two levels deep),
 *  so any play's output lands in the table's email/phone columns. */
export function contactFields(result: unknown): { email: string | null; phone: string | null } {
  let email: string | null = null;
  let phone: string | null = null;
  const visit = (v: unknown, depth: number) => {
    if (!v || typeof v !== "object" || depth > 2) return;
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (typeof x === "string") {
        if (!email && /email/i.test(k) && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)) email = x;
        if (!phone && /phone|mobile/i.test(k) && /\d{7,}/.test(x.replace(/\D/g, ""))) phone = x;
      } else visit(x, depth + 1);
    }
  };
  visit(result, 0);
  return { email, phone };
}
