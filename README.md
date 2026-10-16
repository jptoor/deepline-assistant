# Deepline Assistant

An open-source Chrome side panel that runs your team's [Deepline](https://deepline.com) plays on whatever you are looking at: a LinkedIn profile, company, Sales Navigator lead, list or search, a Salesforce or HubSpot record, or any company website. Results are saved to your table in your Deepline workspace and listed in the panel.

**It reads two things: the active tab's URL and its title.** No content scripts, no page reading, no files exposed to web pages, and nothing injected into LinkedIn. Plays do the lookups in Deepline. The whole extension is about 70 KB.

## For reps

1. Add the extension. A Deepline sign-in tab opens; sign in with your usual account. If you're already signed in, there's nothing to do.
2. Open any LinkedIn profile, company, search, Sales Navigator lead or list, a Salesforce or HubSpot record, or a company website.
3. Click the button pinned at the bottom of the panel. It always says what it will do and what it costs.

Everything you look up is saved under **Your lookups**, so you can find it again.

## For the central team

Run the **Deepline Assistant setup** play once in the Deepline app (`examples/assistant-setup.play.ts`). It creates the lookups table and saves what reps see:

- which actions appear on person, company, search and CRM pages, in order (the first is the pinned button);
- which handoffs (add to CRM, add to sequence) appear on a finished result;
- the button text reps see for each action;
- when a run asks before spending (default: over 25 credits) and the default search import size.

Run it again to change anything; reps pick it up the next time they open the panel. If nobody has run it, the panel sets itself up with defaults (work email, phone, job change check) on the first rep's first open.

To roll out to the whole team, force-install the extension through Google Admin. Teams on a dedicated Deepline host set `baseUrl` through Chrome policy (`src/managed-schema.json`).

## How it works

The panel reads the active tab's address and title, picks the team's actions for that kind of page, and fills each action's inputs by name (`linkedin_url`, `domain`, `search_url`, `crm_id`, `first_name`, ...). It starts the run, waits up to 15 s, then checks status until it finishes. Each run is one row in `assistant.records` per (rep, page, action), written before the run starts, so a closed panel never loses a run.

## Install (developer mode)

```sh
npm ci && npm run build
```

Load `dist/` at `chrome://extensions` with Developer mode on. Press Alt+Shift+D or click the toolbar icon to open the panel.

## Plays

Any published play can be an action. A play that declares `context` receives the whole page context, trimmed to the keys it declares. `examples/assistant.play.ts` is a combined work email + phone action for profiles and Sales Navigator leads.

## Develop

```sh
npm test        # unit tests
npm run build   # dist/
npm run pack    # build + release zip with manifest checks
```

See [docs/DESIGN.md](docs/DESIGN.md) for the user journeys and research behind the design.

## License

MIT
