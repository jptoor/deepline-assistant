# Deepline Assistant: design

## Principles

From the [ZoomInfo extension teardown](research/zi-extension-analysis.md), the [competitor review](research/competitor-extensions.md) and the October 2026 /last30days sweeps:

- **Nothing on the page.** ZoomInfo injects a 138 KB content script into every site, scrapes LinkedIn with CSS selectors, uploads the whole page to an AI parser when selectors miss, and exposes a fixed web-accessible URL that sites can probe. LinkedIn checks for about 6,200 extensions and bans tools that "scrape, modify the appearance of, or automate activity on" it. The assistant has no content scripts and no web-accessible resources; its only page input is the tab URL and title (`tabs` permission). `scripts/pack.mjs` fails the build if that changes.
- **Server-side work, server-side state.** Every lookup is a Deepline play. Results live in the workspace database, so they survive reinstalls, are shared with plays and SQL, and the panel is a view over them.
- **One click to a result.** The best-rated tools (Hunter 4.8★, Kaspr 4.7★, Apollo 4.6★) are praised for one click to a usable result, not for feature count. ZoomInfo's July 2026 side-panel rebuild fell to 1.6★ over lost features, a separate login that failed while users were signed in on another tab, and crashes after export.
- **No separate login.** Reuse the deepline.com session; fall back to device approval.
- **Small.** About 70 KB unpacked against ZoomInfo's 33 MB.

## Journeys

| # | Journey | What the rep does | What happens |
|---|---|---|---|
| J1 | Connect | Opens the panel, clicks **Sign in to Deepline** (or **Connect with device approval**) | The panel reads the session or polls the device claim, then creates the rep's table once |
| J2 | Person | Opens a LinkedIn profile or Sales Navigator lead | The card shows the name from the title and any existing rows for this person; the primary button runs the top play (default: work email + phone) |
| J3 | Company | Opens a LinkedIn company page or any company website | Context is the company slug or domain; company plays are listed |
| J4 | Search or list | Opens a LinkedIn or Sales Navigator search or list | The search URL is handed to a search-import play; Deepline fetches results server-side |
| J5 | CRM record | Opens a Salesforce Lightning or HubSpot record | Object type and id are sent to a CRM play |
| J6 | My table | Scrolls to **My table**, filters, copies an email, clicks a name | Rows are newest first; clicking a name opens its page; pending rows update live |
| J7 | Closed mid-run | Closes the panel while a play runs | The row stays `queued`/`running`; the next open polls and records the result |

## Data flow

```
tab URL + title ─▶ pageContext() ─▶ inputFor(play) ─▶ POST /api/v2/plays/run (waits ≤15 s)
                                                        │
assistant.records ◀─ startSql (before run) ◀────────────┤
assistant.records ◀─ finishSql ◀─ GET /api/v2/runs/:id/status (poll) ◀┘
panel ◀─ SELECT ... WHERE owner = me
```

## Deferred

- **Gmail and Outlook.** A thread's address is in the DOM, not the URL. Needs an explicit per-site permission and a click-to-read design.
- **Selecting people on search result pages.** Needs DOM reading; whole-search import (J4) covers the volume case server-side.
- **Credit estimates on buttons.** `GET /api/v2/plays?include_cost_estimates=1` exists; not wired yet.
- **Team view of the table.** Rows are already in one table with an `owner` column; a "Team" filter is one query.

## Server-side gaps (deepline-api)

- `POST /api/v2/plays/run` has no `Idempotency-Key`; the panel disables a play's button while its row is pending.
- API keys are workspace-wide with no extension scope.
