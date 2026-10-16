/**
 * Deepline Assistant setup. Run once by whoever manages Deepline for the team,
 * from the Deepline app (Plays > Deepline Assistant setup > Run). Reps never
 * run this. It creates the table the extension saves lookups to and records
 * which actions reps see on each kind of page, which plays hand a finished
 * result off (CRM, sequence), and when a run needs a confirm. Run it again to
 * change any of those; reps pick the change up the next time they open the
 * panel.
 */
import { definePlay } from 'deepline';

type SetupInput = {
  person_actions?: string[];
  company_actions?: string[];
  search_actions?: string[];
  crm_actions?: string[];
  handoffs?: string[];
  /** Button text reps see, e.g. { "prebuilt/person-linkedin-to-email": "Find work email" }. */
  labels?: Record<string, string>;
  confirm_over_credits?: number;
  default_import_cap?: number;
};

const DEFAULTS = {
  person_actions: ['prebuilt/deepline-assistant', 'prebuilt/job-change-check'],
  company_actions: [] as string[],
  search_actions: [] as string[],
  crm_actions: [] as string[],
  handoffs: [] as string[],
  labels: { 'prebuilt/deepline-assistant': 'Find email + phone', 'prebuilt/job-change-check': 'Check for a job change' } as Record<string, string>,
  confirm_over_credits: 25,
  default_import_cap: 25,
};

const keys = (v: unknown, d: string[]) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()).slice(0, 8) : d);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d);
const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;

export default definePlay(
  'deepline-assistant-setup',
  async (ctx, input: SetupInput) => {
    const i = input ?? {};
    const config = {
      actions: {
        person: keys(i.person_actions, DEFAULTS.person_actions),
        company: keys(i.company_actions, DEFAULTS.company_actions),
        search: keys(i.search_actions, DEFAULTS.search_actions),
        crm: keys(i.crm_actions, DEFAULTS.crm_actions),
      },
      handoffs: keys(i.handoffs, DEFAULTS.handoffs),
      labels: i.labels && typeof i.labels === 'object' ? Object.fromEntries(Object.entries(i.labels).filter(([, v]) => typeof v === 'string' && v.trim()).slice(0, 40)) : DEFAULTS.labels,
      confirm_over_credits: num(i.confirm_over_credits, DEFAULTS.confirm_over_credits),
      default_import_cap: num(i.default_import_cap, DEFAULTS.default_import_cap),
    };
    const statements = [
      'CREATE SCHEMA IF NOT EXISTS assistant',
      `CREATE TABLE IF NOT EXISTS assistant.records (owner text NOT NULL, entity_key text NOT NULL, play_key text NOT NULL, kind text, label text, url text, run_id text, status text NOT NULL, email text, phone text, result jsonb, error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (owner, entity_key, play_key))`,
      'CREATE INDEX IF NOT EXISTS records_owner_updated ON assistant.records (owner, updated_at DESC)',
      'CREATE TABLE IF NOT EXISTS assistant.config (id text PRIMARY KEY, config jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())',
      `INSERT INTO assistant.config (id, config) VALUES ('default', ${lit(JSON.stringify(config))}::jsonb) ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config, updated_at = now()`,
    ];
    for (const [n, sql] of statements.entries()) {
      await ctx.tools.execute({ id: `setup_${n}`, tool: 'query_customer_db', input: { sql, max_rows: 1 }, description: 'Set up Deepline Assistant for this workspace.', staleAfterSeconds: 0 });
    }
    return { ok: true, config };
  },
  { description: 'One-time setup for the Deepline Assistant Chrome extension: choose what reps see on each page.' },
);
