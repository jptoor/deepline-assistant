# ZoomInfo Chrome Extension: static teardown (v12.22.1)

Source: Web Store id `fofjcndophjadilglgimelemjkjblgpf`, CRX downloaded 2026-10-15 (10.5 MB CRX3, 1322-byte header), unpacked to
`/private/tmp/claude-501/-Users-jaitoor-dev-deepline-api/e6e0dca5-34c0-44a2-b649-663f8d867778/scratchpad/zi-crx/x/`. Nothing from the package was executed.

Path conventions in this report:
- `x/...` = file inside the unpacked extension.
- `pretty/<file>:<line>` = line in the prettier-formatted copy at `.../scratchpad/zi-pretty/` (same code, reformatted; minified originals have no useful line numbers). `pretty/sp.js` = `x/assets/sidepanel-BoH_JRLd.js`.
- `remote/...` = public config the extension fetches at runtime from `https://cex.zoominfo.com/`, saved to `.../scratchpad/zi-remote/` (fetched with plain curl; these are what actually define the surfaces).

---

## 1. Manifest summary (`x/manifest.json`)

| Field | Value |
|---|---|
| Version | 12.22.1, `manifest_version: 3` |
| Permissions | `contextMenus`, `cookies`, `sidePanel`, `storage`, `tabs`, `webNavigation` |
| Host permissions | `<all_urls>` |
| Optional permissions | none |
| Background | module service worker `x/service-worker-loader.js` -> `x/assets/background.ts-Cr4G_1A1.js` (14.9 KB) |
| Content scripts | one entry: `x/assets/content.ts-loader-iwANZZPn.js`, `matches: ["<all_urls>"]`, `run_at: document_idle`, top frame only (no `all_frames`). Excludes localhost/127.0.0.1 and 33 `*.zoominfo.com` app hosts |
| Action | no `default_popup`; click opens the **side panel** (`x/index.html`), handled in `pretty/background.ts-Cr4G_1A1.js:252` |
| Side panel | not declared in manifest; set per tab via `chrome.sidePanel.setOptions({path:"index.html?tabId=..."})` (`pretty/background.ts-Cr4G_1A1.js:46-57`) |
| Commands | `_execute_action` = Ctrl+J / Cmd+J |
| externally_connectable | none |
| oauth2 | none (auth is the `ziaccesstoken` cookie on app.zoominfo.com) |
| web_accessible_resources | `index.html`, `content.ts-Brl1Oy6w.js`, `search-anywhere.constants-*.js`, `search-anywhere.utils-*.js`, `index-B0YsWP0N.js`, all to `<all_urls>`, `use_dynamic_url:false` (so any site can fingerprint the extension by probing `chrome-extension://fofj.../index.html`) |
| Sandbox | `x/artifact-sandbox.html` with `unsafe-eval`, for rendering AI-generated "artifacts" |
| CSP connect-src | `*.zoominfo.com`, `*.zoominfo.co`, Twilio (wss+https), Amplitude, LaunchDarkly, Datadog, Google Fonts |
| Extra pages | `x/mic-permission.html` + `x/mic-permission.js`: one-off tab to obtain microphone grant for the dialer |

Context menus (`pretty/background.ts-Cr4G_1A1.js:709-749`): on the toolbar icon "Open as popup" and "Easy Access Tab" checkboxes; on text selection `Search "%s" in ZoomInfo` -> "Search for Contact" / "Search for Company". On first install it opens `https://www.gtm.ai/` (`:804`).

## 2. Architecture in one paragraph

The content script is a small, config-driven **scraper engine**. On every page it classifies the URL against a remote `page-type.config.json`, and on a known page type it downloads a remote CSS-selector config and scrapes structured entities (name, title, company, LinkedIn URL, past jobs, image, location, email) from the DOM. It hands the result to the background worker, which stores it per tab in `chrome.storage.session` (`tabStates_<tabId>`, with LRU eviction at 900 KB, `pretty/background.ts-Cr4G_1A1.js:339-378`). The side panel (`x/index.html` -> 7.2 MB React app, which is the same "Sales Hub / GTM Workspace / Copilot" web app also shipped as a desktop Electron app, see `electronAPI` check at `pretty/sp.js:15446`) reads that state and calls ZoomInfo match APIs. Nothing is matched server-side until the side panel is open. The content script also injects three tiny UI widgets on every site and a hidden tracking iframe on ~160 listed domains.

## 3. Surfaces

Surface definitions are NOT hardcoded. `pretty/search-anywhere.constants-C1Sr4ni6.js:36-37,256-257` builds URLs from `https://cex.zoominfo.com/cex-scraper-config-v2` (`/page-type/page-type.config.json` and `/selectors/<path>`), in-memory cached 2 h per document (`:1, 199`). ZoomInfo can add, remove, or change surfaces and selectors without a store release. Current live config: `remote/page-type.config.json`. Hardcoded fallbacks for URL-ID CRMs are in `pretty/search-anywhere.constants-C1Sr4ni6.js:467-760`.

Two parse types:
- **scraper**: DOM scraping with remote selectors.
- **url**: only a record ID regex-extracted from the URL (CRMs). No DOM read; the side panel resolves the ID via ZoomInfo's CRM integration (`/ziapi/crm-exports-api/integration-service/v2/entities`, `/userData/v2/findCrmEntities`).

| Site | Match pattern (from `remote/page-type.config.json`) | Context read | UI / handler |
|---|---|---|---|
| LinkedIn profile | `linkedin.com` `/in/.*` (public + logged-in variants) | Full name split first/middle/last, headline title, current company, company LinkedIn URL, profile image, location, every experience entry (title, company, from/to dates, isPresent) as `resumes[]`, past jobs. Selectors: `remote/li-private-person.json` (`main.scaffold-layout__main`, `h1.text-heading-xlarge`, SDUI `componentKey*="Topcard"`...) | `Ct` observer, supports a fast "partial" scrape then a full one (`pretty/content.ts-Brl1Oy6w.js:2531-2588`) |
| LinkedIn company | `/company/.*`, `/school/.*`, `/products/...` | name, domain, industry, location, image, URL | `$s` (`:2514-2530`) |
| LinkedIn search | `/search/results/people|companies|all/` | list of up to N people/companies per page | `qs`/`go` (`:2589-2626`, `:2939-3052`) |
| Sales Navigator | `/sales/lead/`, `/sales/people/`, `/sales/search/people`, `/sales/lists/people/`, `/sales/company/`, `/sales/search/company`, `/sales/lists/company/`, `/sales/accounts/` | Same person fields; list pages scrape every row incl. past job and current-role tenure (`remote/sn-search.json`). Watches `#content-main` for the selected-lead side pane and rescrapes that single lead (`:2893-3052`) | lazy-list handling: temporarily hides list items with `visibility:hidden;max-height:0` and nudges `scrollTop` to force LinkedIn to render virtualized rows (`:1240-1253, 1340-1390`) |
| LinkedIn Recruiter | `/talent/.*profile/`, `/talent/search`, `/talent/hire` + inbox | profiles, search/project lists, and the contact pane opened inside the Recruiter inbox modal | `co` + inbox watcher `Qt` (`:2699-2892`) |
| Indeed | `indeed.com` `/resume/`, `/search/person`, `/hiring/projects/...` | resume name, title, past jobs; external URLs are blanked before storage (`pretty/search-anywhere.constants-C1Sr4ni6.js:771-782`) | `Ks`/`Vs` |
| Google Calendar | `calendar.google.com` `/calendar/.*` | when an event detail modal (`#xDetDlg`) opens: every guest's `data-email` + name, meeting name/date/time; drops noreply/resource calendars (`pretty/content.ts-Brl1Oy6w.js:2203-2306`) | attendee list -> person match |
| Gong | `gong.io` `/engage/people`, `/engage/accounts/CRM/.../contacts`, `/crm`, `/deals` | person/company DOM scrape; on `/deals` reads opportunity ID from an href (`:2139-2202`) | |
| Bullhorn | `app.bullhornstaffing.com` | watches the left nav tabs, then polls the active iframe (`iframe#CandidateWnd.active` etc.) for its URL and extracts the record ID (`:117-307`) | |
| Salesforce | `salesforce.com`, `force.com` | record ID by prefix: 001 Account, 003 Contact, 00Q Lead, 006 Opportunity | url parse |
| HubSpot | `hubspot.com` `record/0-1|0-2/<id>`, `contact/<id>`, `company/<id>` | record ID; on list views it scrolls the table to the last row and back to force-render (`:2357-2437`) | |
| Dynamics, Marketo, Outreach, Salesloft, Pipedrive, SugarCRM, Zoho, Crelate, Greenhouse, Pardot (hardcoded only), Chorus | see `remote/page-type.config.json` | record ID from URL | url parse |
| Google Maps | page type exists in code (`GOOGLE_MAPS`, `:2307-2356`) but no domain in current remote config | sends empty context | |
| **Any other website** | everything else | Only the hostname. It is sent as a company entity `{domain: hostname}` (`:4343-4370, 4472-4484`); side panel calls company match by domain | none until panel opens |
| Gmail / Outlook web | NOT a scraped surface. No code reads mail threads. Gmail only appears as a compose deep link in `x/eaas/agentic-email-composer.js` | hostname only (falls into "any website") | but see the tracking pixel below |
| Google search | not a surface | hostname only | |
| claude.ai, chatgpt.com | `remote/notification-trigger-urls-v2.config.json` | URL match + optional selector | full-width toast "Make Claude/ChatGPT smarter with ZoomInfo... 100 free AI credits" linking to ZoomInfo's MCP connector listings, shown once per hostname (`pretty/content.ts-Brl1Oy6w.js:3319-3529`) |

UI injected on **every** top-level page (`pretty/content.ts-Brl1Oy6w.js:4514-4521`):
1. **Easy Access pull-out tab**: 44 px red ZoomInfo tab fixed at the right edge, draggable vertically, shadow DOM, z-index max (`:3646-3977`). On by default; hidden while panel open or site blocked ("Block on this site", stored as `blockedSites` keyed by registrable domain).
2. **Search Anywhere pill**: on text selection of 4-80 chars and at most 4 spaces, a "Search for: Person | Company" pill appears above the selection (`:4008-4328`; length rules in `pretty/search-anywhere.utils-B6Vd6mMZ.js`). Off by default (`searchAnywherePopupEnabled === true` required, `:4142`), but a document-wide `mouseup` listener is always attached.
3. **MCP toast** on claude.ai / chatgpt.com (above).
4. **Document Picture-in-Picture panel** ("Open as popup", `:3530-3645`): the side panel app in an always-on-top PiP window with `allow="microphone; clipboard-write"`, guarded by a single-use token from the background (`pretty/background.ts-Cr4G_1A1.js:88-105`).

## 4. Feature inventory

Derived from flag names (`pretty/index-B0YsWP0N.js:204-297`), analytics events (same file, ~200 event names), and UI strings in `pretty/sp.js`.

Core extension features:
- **Person / company match** on the current page or list (up to 100 rows per request, `AZ = 100`, `pretty/sp.js:107771`).
- **Reveal** email/phone (credit-consuming): `viewContacts` with `unmaskEmailAndPhone:true`, `creditSource` (`pretty/sp.js` `N0t`, search `profileServiceUrl}/viewContacts`). **Auto reveal** toggle (`isAutoRevealEnabled` is sent on every match request, `MCn` near `pretty/sp.js:108400`; flag `dozi33-zoo-78649-reachout-revealToggle-default-off`; menu string "Auto reveal contact").
- **Export** to Salesforce, HubSpot, Dynamics, Outreach, Salesloft, Marketo, Pardot, Eloqua, Groove, Gong, Excel/CSV, vCard (`/anura/userData/exportContactsToVCard`), PDF (`exportCompanyToPdf`); flag limiting extension exports to SF + Outreach (`zoo-184105-...`).
- **Add to sequence** (`/integration-service/addPersonToSequence`, `sa-flows`), Engage subscription check.
- **Lists / tags** (`/ziapi/user-tags`, `/ziapi/user-tags-facade`, targeted-accounts genericList), **Audiences** (`zoo-184247-add-to-audience`, direct audience creation).
- **Similar contacts / similar companies** (`/contact-recommender/v4/lookalike`), **Buying committee / Buying Group** (`/ziapi/buying-committee/api/v2/buying-committee`), **Org charts** (`orgChartFacetData`).
- **Intent** (`/anura/real-time-intent`, intent-management API, competitor drilldown), **Scoops** (`scoopsSearch`), **WebSights** visitor analytics (`/mos-data/v1/websights/...`), **News**, **Technographics** (`quick-search/tech`, tech favorites), UCC filings, funding, hiring signals, **Pulses/feed**, **Follow company**.
- **Suggest an update / Fix-it** (`/anura/fixit/profile/update/contact|company`).
- **Copilot / Agentic AI chat** (`/ziapi/agentic-ai-service`, CopilotKit runtime, threads, artifacts, PPTX/PDF docs, AI Docs), **contact briefing**, **account context**, **talking points** stream (`/engagement-content-generator-rest-api/api/v1/talking-points/stream`).
- **AI email composer** and **AI dialer** (Twilio) as local Angular web components (`x/eaas/agentic-email-composer.js` 3.8 MB, `x/eaas/agentic-dialer.js` 2.5 MB, mapping at `pretty/sp.js:392444`).
- **Chorus / meetings**: recordings playback, snippets, playlists, scorecards, coaching, meeting prep from calendar, follow-up email.
- **CRM updates extraction** (AI proposes CRM field updates, approve/reject events), **Workbooks** (spreadsheet enrichment), bulk export, saved/recent searches, command palette.
- **AI page parser fallback** (flag `zoo-188949-chrome-extension-ai-parser`, see section 6).

## 5. Endpoint inventory

All hosts from the prod env block at `pretty/salesnav-hydration.utils-DFvG9_RC.js:770-848`. Auth is cookie-based: `ziaccesstoken` (JWT; `ziUserId`, `ziTenantId`, email decoded client-side, `:566-640`) plus `ziid`, `zisession` on app.zoominfo.com (`:1007`), axios `withCredentials:true` (`pretty/sp.js:15407-15412`). Refresh: `gw-app.zoominfo.com/gw/ziapi/refreshAccessToken`. The staging host `dozi-staging.zoominfo.com` is hardcoded as `dataAccessServiceUrl` even in the prod block (`:789-790`).

| Class | Endpoints |
|---|---|
| Auth / user | `login.zoominfo.com/?isReachout=true&newtab=true` (`pretty/background.ts-Cr4G_1A1.js:511`), cookie watch `:154-167`, `/ziapi/user-info-svc/api/v1/user-details`, `/ziapi/entitlement-api/external`, `/ziapi/tenant`, `/ziapi/ums/v2`, `/ziapi/reachout-api-zios/api/v1/preferences/user-preferences` |
| Person lookup | `POST /ziapi/reachout-api-zios/api/v1/match/people` (single), `POST /ziapi/reachout-api-zios/api/v2/match/people-bulk` (lists, `{people:[...], filters}`) (`pretty/sp.js:108444, 108599`); `profiles/graphql/personSearch` |
| Company lookup | `POST /ziapi/embedded-apps-api/api/v2/company-match`, `POST /ziapi/reachout-api-zios/api/v1/match/company-bulk` (`pretty/sp.js:107718, 107832`); `/ziapi/embedded-apps-api/api/v1/companies`; `profiles/graphql/companySearch`; `/ziapi/ip2org` |
| Reveal (credits) | `POST app.zoominfo.com/profiles/viewContacts` `{personIds, unmaskEmailAndPhone:true, creditSource}`; credit status `/anura/userData/creditInfo`, `/credit/usage`, `/ziapi/aicredits`, `platform/credits/tenant` |
| Intent / signals | `/anura/real-time-intent`, `/ziapi/intent-management`, `/ziapi/insights-api/api/user-insights/v2/*`, `/ziapi/pulseforge-api/api/v1`, `/ziapi/newsfeed/news`, `zimos-api/mos-data/v1/websights/...` |
| Scoops | `/profiles/graphql/scoopsSearch`, `/ziapi/shared-mapping-api/scoop/getAllMappings` |
| Recommendations / org | `/ziapi/recommendation-engine/publishing/contact-recommender/v4/lookalike`, `/ziapi/buying-committee/api/v2/buying-committee`, `orgChartFacetData` |
| Export to CRM | `/ziapi/crm-exports-api` (`/userData/v2/exportZoomEntitiesToCrm`, `exportZoomEntitiesWithRelatedEntity`, `findCrmEntities`, `oauth2/v2/authenticate`, `getConnectedIntegrations`), `/ziapi/bulk-export-api/api/bulk-export/*`, `/ziapi/export-facade/api/v1/list-builder/export/*`, `/ziapi/csvexport-svc/*`, `/ziapi/org-import/v2/data/checkIfProfilesImported` |
| Lists / tags | `/ziapi/user-tags`, `/ziapi/user-tags-facade`, `/ziapi/targeted-accounts/v2/genericList`, `/ziapi/workbook-service/api/v3/workbooks`, `/ziapi/workspaces-api/api` |
| Engage / sequence | `integration-service/addPersonToSequence`, `integration-service/v2/sa-flows`, `/ziapi/integrated-platform/engage-subscription/_retrieve`, `/ziapi/engagements-ms/*` (email thread, audio, video) |
| Copilot / AI | `/ziapi/agentic-ai-service/api` (`platform/threads/*`, `artifacts`, `agents/*/billing_details`, `pptx/*`), `chat-loader.js`, `/ziapi/ai-page-params-api/api/page-params` (HTML parser), `/ziapi/engagement-content-generator-rest-api/api/v1/talking-points/stream`, `/ziapi/sales-enablement/api/v1`, `gtm-graphql.zios-apps-primary.prd.zi-int.com/graphql` (internal-looking hostname exposed) |
| Chorus | `/ziapi/chorus-webserver/api/v1/users`, `snippet.zoominfo.com` |
| Remote config | `cex.zoominfo.com/cex-scraper-config-v2/page-type/page-type.config.json`, `.../selectors/<site>/<type>.config.json`, `cex.zoominfo.com/notification-trigger-urls-v2.config.json`, `cex.zoominfo.com/pixel-relevant-hosts-v2.jsonl` (all `max-age=3600`) |
| Feature flags | LaunchDarkly client id `685da2a5a3c1a30919d8fab2` via `*.ld-proxy.zoominfo.com`; flags mirrored into `chrome.storage.local.featureFlags` (`pretty/background.ts-Cr4G_1A1.js:535-544`) |
| Telemetry | Amplitude via `events.zoominfo.com` proxy (background posts user_email, tenant_id, user_id, UA, `sourceDomain`, `pretty/background.ts-Cr4G_1A1.js:176-214`); Datadog RUM with **sessionSampleRate 100 and sessionReplaySampleRate 100**, privacy `mask-user-input` (`pretty/sp.js:76115-76140`, env `pretty/salesnav-hydration.utils-DFvG9_RC.js:833`); `SCRAPE_TIMING` events include `page_url` of every classified page (`pretty/content.ts-Brl1Oy6w.js:2046-2073, 4377-4395`), `extension_load_timing` (`pretty/sp.js:391311`) |
| Tracking pixel | hidden iframe `https://app.zoominfo.com/reachout-pixel/debug?app=DOZI&url=<current URL minus query>` (`pretty/content.ts-Brl1Oy6w.js:3255-3318`) |

## 6. Client-side scraping behavior (what is read vs sent)

1. **Classification (every page, client-side).** URL regex against remote config; unknown site -> context = hostname only (`pretty/content.ts-Brl1Oy6w.js:4396-4499`). Nothing posted to ZoomInfo at this step except the config GETs.
2. **Selector scraping (known pages, client-side).** Pure `querySelector` + text extraction with ~30 named handler functions (`extractName`, `getAllJobDetailsFromWorkExpLinkedInSalesNav`, `getResumesFromRecruiterPersonSearchResult`, etc., registry at `:1017-1048`). It waits up to ~6 s for the container (`:1179-1208`), handles captcha/no-results selectors, MutationObservers the results container and rescrapes on change (300 ms debounce, `:1709-1737`), and stamps the container node with `__ziLastScrapedUrl` to avoid emitting stale SPA content (`:1752-1772`).
3. **No LinkedIn API use.** There are no Voyager / `/voyager/api` calls anywhere in the package (grep across all JS returned 0). It does not read LinkedIn cookies or CSRF tokens. Everything is visible-DOM reading. It does manipulate LinkedIn's DOM to force lazy rendering (hide items, scroll nudges).
4. **What leaves the browser for a match:** only the structured fields (`firstName, middleName, lastName, fullName, jobTitle, companyName, externalURL (LinkedIn URL), fullExternalURL, imageUrl, location, pastJobs[], resumes[] with dates, originalURL, pageName, sourceWebsite, feature, fromLinkedin`) (`pretty/sp.js` `MCn`, ~`108395-108440`). Matching happens only when the side panel/PiP is open, from the side-panel origin.
5. **Full-page HTML upload (AI parser fallback).** If the flag `zoo-188949-chrome-extension-ai-parser` is on and a **person** page's scrape is complete but missing mandatory fields (e.g. `fullName`, `externalURL`), or a config sets `forceAiParser`, the side panel sends `CAPTURE_HTML` to the content script. The content script clones the whole `document`, strips `script/style/svg/iframe/canvas/textarea/...`, keeps only `class/id/role/type/data-*` plus `href/src/value/placeholder` attributes, and returns the outerHTML (`pretty/content.ts-Brl1Oy6w.js:3153-3242, 4505-4511`). The side panel POSTs it as multipart `fileContent` + `pageUrl` + `entityTypeMode` to `/ziapi/ai-page-params-api/api/page-params` (60 s timeout) (`pretty/sp.js:391226-391300`). This is effectively "send the rendered LinkedIn page to an LLM". It includes everything visible on the page (other people in sidebars, messages if on a page with them) and `input` values. Circuit breaker: after 3 consecutive selector failures the AI path is forced on for 15 minutes (`pretty/content.ts-Brl1Oy6w.js:1523-1580`). The AI result is written back as `isAIGeneratedPageParams:true` and matched like a scrape.
6. **Tracking pixel on ~160 domains.** `remote/pixel-relevant-hosts-v2.jsonl` is a ZoomInfo **competitor list** (rows carry `COMPETITOR`, `CHORUS_TRACKER_NAME: "CI: Apollo.io"`, `TECHNOLOGY_ID`): Apollo, Clay, Lusha, Cognism, 6sense, Demandbase, Seamless.ai, UpLead, LeadIQ, Amplemarket, Nooks, Common Room, Exa, plus generic tools (mail.google.com, outlook.com, outlook.office365.com, salesforce.com, force.com, hubspot.com, slack.com, chatgpt.com, claude.ai, gemini.google.com, perplexity.ai, cursor.com, vercel.com, replit.com, zapier.com, aws.amazon.com...). On any page whose **hostname contains** one of these strings, the content script injects a 1x1 iframe to `app.zoominfo.com/reachout-pixel/debug?app=DOZI&url=<href.split("?")[0]>`, carrying the user's ZoomInfo cookies. This tells ZoomInfo which logged-in customer visits which competitor/tool. Because it strips only `?query`, the fragment survives: on Gmail that is `#inbox/<threadId>`; on Salesforce Lightning the record path. Entries with a path (`linkedin.com/sales`, `ampliz.com/ampliz-salesbuddy`) can never match a hostname, so LinkedIn itself is not pixeled (a latent bug).
7. **Per-tab state** lives only in `chrome.storage.session` (cleared on browser restart); flags and UI prefs in `chrome.storage.local`.

## 7. Performance footprint

| Item | Size |
|---|---|
| CRX | 10.5 MB; unpacked 33 MB, 481 files |
| JS | 374 files in `x/assets`, 22 MB, plus 6 MB `x/eaas` |
| Of which Shiki syntax-highlighting grammars/themes | 237 files, 14.8 MB (emacs-lisp 780 KB, cpp 626 KB, wasm 622 KB, wolfram 262 KB...) for rendering code blocks in Copilot chat |
| Diagram libs (mermaid, cytoscape, wardley, ...) | 29 files, 2.6 MB |
| Side panel main bundle | `x/assets/sidepanel-BoH_JRLd.js` 7.2 MB + 957 KB CSS; React 19 (`react.transitional.element`), MUI theme, Tailwind classes, TanStack Query, Apollo GraphQL, CopilotKit, AG Grid, Froala editor, pdfmake (1.36 MB), Twilio, Datadog, Amplitude, LaunchDarkly |
| eaas components | Angular + Lit web components (`x/eaas/*.js`) |
| **Per-page content script cost (every site)** | loader 0.4 KB, dynamic `import()` of `content.ts` 98 KB + constants 18 KB + `index-B0YsWP0N.js` 22 KB (MUI palette + ~200 analytics enums + flag enum, mostly dead weight on a page) = ~138 KB parsed per top-level page |
| Per-page network | GET page-type config (32 KB), GET pixel host list (23 KB), GET notification config (1.5 KB) from cex.zoominfo.com per document (1 h HTTP cache; in-memory cache dies with the page), plus a selector config on known pages |
| Per-page listeners | `popstate`, `hashchange`, document `mouseup` + `keydown` (search pill), `resize`, `chrome.storage.onChanged` x4, `runtime.onMessage`; on known pages MutationObservers on `document.body` subtree (Gong deal, Calendar, Maps, HubSpot lists, Recruiter inbox) |
| Background | reacts to every `tabs.onUpdated`/`onHistoryStateUpdated`/`onActivated` by messaging the tab, writes full page context JSON to session storage |

## 8. Design flaws and opportunities

Flaws / risks observed:
1. **Remote-controlled scraping on `<all_urls>`.** Surfaces and selectors are fetched JSON, so behavior changes without store review. Combined with `<all_urls>` + `cookies` + `tabs`, the permission footprint is the maximum Chrome allows.
2. **Competitor-visit tracking pixel** fires for the whole sales/AI tool landscape and for Gmail/Outlook/Salesforce/Slack, sending URL path + fragment with the ZoomInfo session. Customers are unlikely to know this. It also uses `encodeURI` (not `encodeURIComponent`) on the URL param.
3. **Full-DOM upload to an AI parser**, with only an attribute allowlist as sanitation; no PII redaction, and input `value`s are kept.
4. **Selector brittleness is the core failure mode.** The LinkedIn person config stacks ~9 alternative selectors per field, including deep `nth-child` chains into SDUI `componentKey` trees; the 3-strike AI fallback exists because these break. LinkedIn SalesNav virtualization needs scroll hacks and style overrides on LinkedIn's own DOM.
5. **Datadog session replay at 100%** of sessions in a panel that shows revealed emails/phones (only user *input* is masked by default).
6. **Bloat.** 15 MB of language grammars and 2.6 MB of diagram libs ship in a prospecting extension; every page pays ~138 KB of parse plus three config fetches even when the user never opens the panel. A theme/analytics enum module is imported into the content script.
7. **Fingerprintable**: web-accessible `index.html` with static URL lets any site detect ZoomInfo users.
8. Staging host `dozi-staging.zoominfo.com` hardcoded in the prod env block; internal GraphQL host `gtm-graphql.zios-apps-primary.prd.zi-int.com` exposed.
9. **No Gmail/Outlook surface**: no email-thread participant extraction, despite those being core prospecting contexts (only Google Calendar attendees are read).
10. Generic websites get domain-only company match; no person extraction from team pages, bylines, or `mailto:` links.
11. The extension is a thin shell over the whole SalesOS web app, so the panel UX is "the ZoomInfo app in 360 px", not a page-aware tool.

Opportunities for a competing extension:
- Keep the good idea (config-driven selectors with versioned remote configs and partial-then-full scrape), but ship the scraper as a small content script and lazy-load anything heavy only when the panel opens. Target under 20 KB on non-matching pages and zero network calls until the user acts.
- Use the page's structured data first (LinkedIn `code` JSON blobs, JSON-LD, OpenGraph) before CSS selectors. Fall back to an LLM over a **redacted text extraction of one region**, not the full DOM, and say so in the UI.
- Add real Gmail/Outlook surfaces: thread participants, signatures, and calendar attendees in one "people in this context" list with bulk enrich.
- Generic-site person extraction (team/about pages, author bylines, mailto/tel) using the same entity schema.
- Request narrow host permissions (`optional_host_permissions` per site, granted on first use) and no tracking pixels. That is a privacy story ZoomInfo cannot match.
- Explicit cost preview before any reveal, no auto-reveal default; this is where ZoomInfo's `isAutoRevealEnabled` flag sits on every match call.
- Expose the same page-context-to-enrichment path through an agent-callable API and CLI so the extension is one client of it, not a fork of the web app.
