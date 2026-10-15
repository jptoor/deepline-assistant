/**
 * Default Deepline Assistant play. The extension sends `context`: what the
 * rep's tab is (kind, URL, title-derived name), never page content. This play
 * does the lookup server-side and returns fields the panel lifts into the
 * rep's table (email, phone).
 *
 *   deepline plays check ./examples/assistant.play.ts
 *   deepline plays publish ./examples/assistant.play.ts
 *
 * Prebuilt sub-plays are receipt-cached workspace-wide, so re-running on the
 * same profile reuses paid results instead of buying them again.
 */
import { definePlay } from 'deepline';

// Every field the extension can send; a play only receives the keys it declares.
type Context = {
  kind: string;
  url: string;
  entity_key?: string;
  label?: string;
  full_name?: string;
  company_linkedin_url?: string;
  search_url?: string;
  crm_system?: string;
  crm_object?: string;
  crm_id?: string;
  linkedin_url?: string;
  sales_navigator_url?: string;
  domain?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
};

export default definePlay(
  'deepline-assistant',
  async (ctx, input: { context: Context }) => {
    const c = input?.context;
    if (!c || typeof c.kind !== 'string') throw new Error('context is required');

    if (c.kind !== 'linkedin_person' && c.kind !== 'salesnav_lead') {
      return { kind: c.kind, note: 'No default enrichment for this page; pick a team play.' };
    }

    // Sales Navigator leads carry no public URL: resolve one from the name.
    let linkedinUrl = c.linkedin_url ?? null;
    if (!linkedinUrl && c.first_name && c.last_name) {
      const found = (await ctx.runPlay('resolve_linkedin', 'prebuilt/person-to-linkedin', {
        first_name: c.first_name,
        last_name: c.last_name,
        ...(c.company_name ? { company_name: c.company_name } : {}),
      }, { description: 'Resolve the public LinkedIn URL for a Sales Navigator lead.' })) as { linkedin_url?: string | null };
      linkedinUrl = found.linkedin_url ?? null;
    }
    if (!linkedinUrl) return { linkedin_url: null, note: 'Could not resolve a public LinkedIn profile.' };

    const email = (await ctx.runPlay('find_email', 'prebuilt/person-linkedin-to-email', { linkedin_url: linkedinUrl }, {
      description: 'Find and validate a work email.',
    })) as { email?: string | null; email_found_and_valid?: boolean; email_source?: string | null };

    const phone = c.first_name && c.last_name
      ? ((await ctx.runPlay('find_phone', 'prebuilt/person-to-phone', {
          first_name: c.first_name,
          last_name: c.last_name,
          linkedin_url: linkedinUrl,
          ...(email.email_found_and_valid && email.email ? { email: email.email } : {}),
        }, { description: 'Find a phone number.' })) as { phone?: string | null })
      : { phone: null };

    return {
      linkedin_url: linkedinUrl,
      email: email.email_found_and_valid ? (email.email ?? null) : null,
      email_source: email.email_source ?? null,
      phone: phone.phone ?? null,
    };
  },
  { description: 'Work email and phone for the LinkedIn profile or Sales Navigator lead open in Deepline Assistant.' },
);
