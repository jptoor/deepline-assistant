# Deepline Assistant

An open-source Chrome side panel that runs your team's [Deepline](https://deepline.com) plays on whatever you are looking at: a LinkedIn profile, company, Sales Navigator lead, list or search, a Salesforce or HubSpot record, or any company website. Results are saved to your table in your Deepline workspace and listed in the panel.

**It reads two things: the active tab's URL and its title.** No content scripts, no page reading, no files exposed to web pages, and nothing injected into LinkedIn. Plays do the lookups in Deepline. The whole extension is about 70 KB.

## How it works

1. **Connect.** Sign in to Deepline in a normal tab, or approve the browser as a device (the same flow as `deepline auth register`).
2. **Open a page.** The panel identifies it from the URL and title: profile slug, Sales Navigator lead id, company slug, search URL, CRM object and id, or domain.
3. **Run a play.** The panel lists plays whose input it can fill (your pinned plays first) and sends only the fields each play declares. It waits up to 15 s for the result, then polls run status.
4. **See it in your table.** Each run is one row in `assistant.records` per (you, page, play). The row is written before the run starts, so a closed panel or crash never loses a run; the next open finishes every pending row.

## Install (developer mode)

```sh
npm ci && npm run build
```

Load `dist/` at `chrome://extensions` with Developer mode on. Press Alt+Shift+D or click the toolbar icon to open the panel.

## Plays

The panel works with any published play. It fills a play's inputs from the page by name: `linkedin_url`, `sales_navigator_url`, `company_linkedin_url`, `search_url`, `domain`, `first_name`, `last_name`, `full_name`, `company_name`, `crm_system`, `crm_object`, `crm_id`, `url`. A play that declares `context` receives the whole page context, trimmed to the keys it declares. Plays with a required input the page cannot fill are hidden.

`examples/assistant.play.ts` is the default play: work email and phone for a LinkedIn profile or Sales Navigator lead.

```sh
deepline plays check ./examples/assistant.play.ts
deepline plays publish ./examples/assistant.play.ts
```

## Your table

The panel creates `assistant.records` in your workspace database on first connect (`CREATE ... IF NOT EXISTS`), keyed by `(owner, entity_key, play_key)`. Email and phone found anywhere in a play result are copied into their own columns. Query it like any workspace table:

```sh
deepline db query "SELECT label, email, phone, play_key, status FROM assistant.records WHERE owner = 'you@company.com' ORDER BY updated_at DESC"
```

## Develop

```sh
npm test        # unit tests
npm run build   # dist/
npm run pack    # build + release zip with manifest checks
```

See [docs/DESIGN.md](docs/DESIGN.md) for the user journeys and research behind the design.

## License

MIT
