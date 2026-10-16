# Prospecting extensions: jobs, journey, and a wireframe rubric

Researched 2026-10-15. This builds on [competitor-extensions.md](competitor-extensions.md) (market map, ratings, LinkedIn risk) and [zi-extension-analysis.md](zi-extension-analysis.md) (ZoomInfo teardown). It does not repeat them. Its purpose is to score Deepline Assistant wireframes against what reps actually do and complain about.

## Method and evidence strength

**Chrome Web Store reviews (122 used).** Each extension's `/reviews?hl=en` page was fetched with curl and parsed from the review data embedded in the page, which gives the full text, per-review stars and date. Each page carries only the **10 most recent reviews**. "Load more" was not paginated, so this is a recency sample, not a random one. Three spam reviews were dropped (a crypto-recovery ad and two Minute Minder ads on the HubSpot listing).

| Extension | Reviews | 1-2★ | Date range | Review page |
|---|---|---|---|---|
| ZoomInfo | 10 | 9 | 2026-07-15 to 09-02 | [CWS-ZoomInfo] |
| Apollo | 10 | 2 | 2026-09-17 to 10-13 | [CWS-Apollo] |
| Lusha | 10 | 0 | 2026-09-08 to 10-13 (mostly one-liners) | [CWS-Lusha] |
| Hunter | 10 | 1 | 2026-07-22 to 10-06 | [CWS-Hunter] |
| Kaspr | 10 | 4 | 2025-08-01 to 2026-08-20 | [CWS-Kaspr] |
| ContactOut | 10 | 1 | 2026-09-17 to 10-09 (7 on one day: likely a review drive) | [CWS-ContactOut] |
| Surfe | 10 | 4 | 2025-09-28 to 2026-09-21 | [CWS-Surfe] |
| lemlist | 9 | 0 | 2025-01-13 to 2025-12-04 (cluster on 2025-01-13: likely a review drive) | [CWS-lemlist] |
| Crystal | 10 | 0 | 2024-02-18 to 2026-02-04 (mostly 2024) | [CWS-Crystal] |
| RocketReach | 10 | 5 | 2025-10-19 to 2026-08-22 | [CWS-RocketReach] |
| Clay for Chrome | 5 | 1 | 2024-02-29 to 2026-06-25 (only 5 exist) | [CWS-Clay] |
| Wiza (bonus) | 10 | 4 | 2025-05-08 to 2026-07-07 | [CWS-Wiza] |
| HubSpot Sales (bonus) | 8 | 4 | 2025-12-03 to 2026-08-05 | [CWS-HubSpot] |
| **Total** | **122** | **35** | 69 are 5★ | |

**YouTube transcripts (21 usable).** Found with `yt-dlp ytsearch`, auto-captions pulled to the scratchpad, collapsed to 30-second blocks with timestamps. Treated as untrusted data. Two videos had almost no captions (`niyNNkFO6c8`, `xTQ_K3V0Z0A`). The Frontier/Exportly founder talk ([rlNCTC2YFqY](https://youtu.be/rlNCTC2YFqY)) failed on YouTube 429s and is **not** used.

| ID | Title (channel, upload date) | Kind |
|---|---|---|
| [EEXffH9vL9w](https://youtu.be/EEXffH9vL9w) | How to use the ZoomInfo Chrome Extension (ZoomInfo, 2026-10-07) | Vendor tutorial |
| [vFfP63BheKw](https://youtu.be/vFfP63BheKw) | ZoomInfo Chrome Extension: 3X Faster LinkedIn Prospecting (ZoomInfo, 2023-11) | Vendor demo |
| [UotsqmRWUY4](https://youtu.be/UotsqmRWUY4) | Zoominfo Chrome Extension: Complete Tutorial (Evaboot, 2024-07) | Competitor tutorial |
| [5o0Xhi8uqus](https://youtu.be/5o0Xhi8uqus) | How to Use ZoomInfo to Find Qualified Leads (Prospeo, 2026-03) | Competitor review |
| [JuWylXgnJRo](https://youtu.be/JuWylXgnJRo) | Start Prospecting with the Apollo Chrome Extension (Apollo, 2023-08) | Vendor tutorial |
| [jTxCWDqmmAs](https://youtu.be/jTxCWDqmmAs) | Apollo.io Chrome Extension Tutorial (GiveMeLeads, 2025-11) | Competitor tutorial |
| [V9D2xcN9UMQ](https://youtu.be/V9D2xcN9UMQ) | How To Use Apollo.io On LinkedIn (AI Mastery, 2026-03) | Neutral tutorial |
| [vxDpXuqnMk8](https://youtu.be/vxDpXuqnMk8) | Apollo.io Review (2026): the Bounce Rates (Prospeo, 2026-04) | Competitor review |
| [2ygHMhpVyLo](https://youtu.be/2ygHMhpVyLo) | How to Use Lusha (2026) (Prospeo, 2026-04) | Competitor review |
| [bd_WYcL84OQ](https://youtu.be/bd_WYcL84OQ) | Lusha Chrome Extension: How it works (Coldlytics, 2023-05) | Competitor test |
| [rITlWiUSOmM](https://youtu.be/rITlWiUSOmM) | Hunter.io Browser Extension (Hunter, 2023-08) | Vendor tutorial |
| [yWhK8f9ipNY](https://youtu.be/yWhK8f9ipNY) | How to Use Hunter.io (2026) (James and Jenna, 2025-10) | Affiliate tutorial |
| [P3eXEx60njk](https://youtu.be/P3eXEx60njk) | Kaspr: How to find a lead (Kaspr, 2024-11) | Vendor tutorial |
| [jO5d4Mqsn90](https://youtu.be/jO5d4Mqsn90) | Surfe Review & Demo (LeadLoft, 2025-09) | Competitor review |
| [qcSJF3PfT0E](https://youtu.be/qcSJF3PfT0E) | Prospecting with HubSpot & LinkedIn using Surfe (AutomateNow, 2024-06) | Partner webinar with Surfe |
| [BRaWouFUot0](https://youtu.be/BRaWouFUot0) | Exportly Intro Video (Frontier, 2025-08) | Vendor demo |
| [X7XNqcOPpNg](https://youtu.be/X7XNqcOPpNg) | Exportly: the Clay-powered Chrome extension (Webflow GTM engineer at The Signal, 2026-06) | **Customer demo** (100+ reps) |
| [L-OD0SIAWs0](https://youtu.be/L-OD0SIAWs0) | How to use the Clay Chrome Extension (Tim Yakubson, 2025-06) | Course seller tutorial |
| [0iht94pzyg0](https://youtu.be/0iht94pzyg0) | Clay Chrome Extension for Website Scraping (Jim Ortiz, 2025-10) | Practitioner tutorial |
| [HKWiYe_DyOM](https://youtu.be/HKWiYe_DyOM) | Best AI Tools for Sales Prospecting in 2026 (Wiza, 2026-05) | Competitor roundup |
| [amhSF3uBOI0](https://youtu.be/amhSF3uBOI0) | LeadIQ Alternatives (2026) (Prospeo, 2026-04) | Competitor roundup |

**How much to trust this:**

- **Workflow steps are strong evidence.** Vendor and third-party tutorials agree on the step order, and the steps are visible on screen.
- **Accuracy numbers from videos are weak.** The bounce rates (ZoomInfo 36%, Apollo 73% valid, Lusha 19% bounce) all come from Prospeo, Wiza, LeadLoft or Coldlytics, each selling a competing product. Read them as "reps care about bounces", not as measurements.
- **Review counts are directional.** Theme counts come from keyword coding of the 122 reviews (`scripts/themes.py` in the scratchpad) plus a manual read. One review can hit several themes.
- **Selection skew.** 10 recent reviews per listing over-weights listings in a bad month: ZoomInfo after its July rebuild, and Surfe after its September redesign. This is useful for the side-panel question but exaggerates churn overall.
- **Reddit was not used.** WebFetch is blocked there.
- **Labels.** Statements marked **(inference)** are my reading, not something a source says.

## Jobs to be done

Frequencies:

- **R** is the number of the 122 reviews that touch the job, from keyword coding checked by hand.
- **T** is the number of the 21 transcripts where the creator performs the job on screen.

| # | Job | R | T |
|---|---|---|---|
| J1 | Reach this person | 33 | 14 |
| J2 | Stay where I am | 40 | 12 |
| J3 | Hand it off without copy-paste | 8 | 15 |
| J4 | Don't pay twice or duplicate | 6 | 5 |
| J5 | Find the right people at this account | 3 | 10 |
| J6 | Trust it before I send | 15 | 9 |
| J7 | Turn a search into a list | 4 | 10 |
| J8 | Know what it will cost | 7 | 7 |
| J9 | Prepare for the conversation | 9 | 5 |
| H1 | Hygiene: don't break my browser or lock me out | 31 | 2 |

### J1. Reach this person
**When I** land on a prospect's LinkedIn or Sales Navigator profile, **I want to** get a working email and direct phone, **so I can** contact them today.

- "I am based in the nordics and could not find ANYTHING. My manager then bought an Apollo license and it has been a game changer for me." (Elísa Ingvarsdóttir, 5★, 2026-10-05, [CWS-Apollo])
- "Its the best for finding contact numbers of career professionals" (Ochuko Esidje, 5★, 2026-10-06, [CWS-Lusha])
- "if I click here on this Apollo button ... I can access the email or the phone number of the lead" ([jTxCWDqmmAs 01:40](https://youtu.be/jTxCWDqmmAs?t=100))

### J2. Stay where I am
**When I** am working in LinkedIn, a CRM or a company site, **I want to** get answers without switching tabs or tools, **so I can** keep my flow and volume.

The R count of 40 combines 29 "easy / one click / fast" reviews and 11 "no switching" reviews.

- "I especially like how quickly I can access information while browsing LinkedIn and other websites without constantly switching between different tools." (Afeefa Khan, 5★, 2026-09-21, [CWS-Apollo])
- "Surfe went from " 1-2" clicks to get most things done, to 7 - 9 clicks Adding a contact - was one click, you need three clicks and waiting for side bar to open." (SVVG SV Venture Group, 1★, 2026-09-10, [CWS-Surfe])
- "everything we've done so far has been completed without ever leaving LinkedIn" ([vFfP63BheKw 01:38](https://youtu.be/vFfP63BheKw?t=98))

### J3. Hand it off without copy-paste
**When I** have the contact, **I want to** push it into my CRM, sequence or list in one action, **so I can** start outreach and keep records clean.

- "Its a one way view of data and I find myself just copy and pasting emails at this point." (Jeffrey Haley, 2★, 2026-06-12, [CWS-RocketReach])
- "Love being able to access contact information, unenroll from sequences, change status, go into the contact page, ect. But these functions constantly disappear" (Charles Balcita, 3★, 2026-08-05, [CWS-HubSpot])
- "add them to an outreach sequence all with one click, which has really saved our reps a lot of time" ([X7XNqcOPpNg 01:36](https://youtu.be/X7XNqcOPpNg?t=96))

### J4. Don't pay twice or duplicate
**When I** look at someone, **I want to** see first whether we already have them (CRM, my past lookups, a teammate's), **so I can** skip them or avoid paying again.

- "I cannot see who I already have in SF so I waste a ton of time targeting contacts I already have access to." (Jeffrey Haley, 2★, 2026-06-12, [CWS-RocketReach])
- "potentially spending more credits to repair records I’ve already paid to process" (Rowan Costello, 1★, 2026-09-29, [CWS-Apollo])
- "dedupe against contacts we already have, surface the contacts we already have in Salesforce, and then add the ones that aren't" ([X7XNqcOPpNg 02:09](https://youtu.be/X7XNqcOPpNg?t=129)). See also "At the top, you can see if the record exists inside of your CRM" ([EEXffH9vL9w 01:40](https://youtu.be/EEXffH9vL9w?t=100)) and Surfe's blue "already in my CRM" highlight ([qcSJF3PfT0E 03:52](https://youtu.be/qcSJF3PfT0E?t=232)).

### J5. Find the right people at this account
**When I** am on a company page or website, **I want to** see the decision makers who fit my persona, **so I can** multi-thread the account.

- "gives you the employee count, decision maker contacts. Its been a great tool to check data and find out information on companies." (Francisco, 5★, 2026-09-29, [CWS-Apollo])
- "from uh 72k leads I've reduced my leads to 12 super qualified decision makers with business emails and phone numbers" ([UotsqmRWUY4 03:55](https://youtu.be/UotsqmRWUY4?t=235))
- "click on buying committee. What's going to happen is a really sophisticated play behind the scenes in Clay ... it will tell the reps exactly who to prospect next" ([X7XNqcOPpNg 02:09](https://youtu.be/X7XNqcOPpNg?t=129))

### J6. Trust it before I send
**When I** get an email or phone, **I want to** know whether it is verified and current, **so I can** protect my domain and not waste dials.

- "Around 3 out of 10 emails bounce or come up as risky." (Arnol Reev Cepe, 1★, 2026-08-20, [CWS-Kaspr])
- "I was skeptical because most extensions just guess the email format, but the data here actually seems verified." (Jerwin, 5★, 2026-10-09, [CWS-ContactOut]; this listing is under a likely review drive)
- "we see that this email has already been verified if it hasn't been verified yet you'll actually have the option here to verify it and you can also review a confidence score ... finally we can review the sources of where this email was found online" ([rITlWiUSOmM 01:08](https://youtu.be/rITlWiUSOmM?t=68)). A competitor demo makes the opposite point: "it found an email for her Microsoft email ... you can see Nicole no longer works at Microsoft" ([jO5d4Mqsn90 01:04](https://youtu.be/jO5d4Mqsn90?t=64)).

### J7. Turn a search into a list
**When I** have built a LinkedIn or Sales Navigator search or list, **I want to** capture and enrich all of it, **so I can** build a sequence-sized list without page-by-page grind.

- "with this feature you can add leads 25 by 25 ... But if you need to have hundreds or even thousands of leads, it takes too much time to do that manually." ([jTxCWDqmmAs 08:24](https://youtu.be/jTxCWDqmmAs?t=504))
- "if you have a lot of leads that process would be would be a bit painful" ([UotsqmRWUY4 05:00](https://youtu.be/UotsqmRWUY4?t=300))
- "The bulk scraping feature is convenient." (Ariadne Koutsonikoli, 5★, 2025-01-14, [CWS-lemlist])

### J8. Know what it will cost
**When I** am about to reveal or enrich, **I want to** know the credit cost and what I will get, **so I can** spend my allotment on the right people.

- "That 'unlimited emails' tag is really just bait." (Arnol Reev Cepe, 1★, 2026-08-20, [CWS-Kaspr])
- "Before you Add to see contacts it will claim to have information (ie it has 2 phone numbers and 3 emails) but after you click Add it does not have the information it claimed to have" (Mackenzie Garry, 1★, 2026-03-09, [CWS-RocketReach])
- "You burn credits even on verified emails that are incorrect." ([vxDpXuqnMk8 03:18](https://youtu.be/vxDpXuqnMk8?t=198), competitor source)

### J9. Prepare for the conversation
**When I** am about to reach out or take a call, **I want to** get a short, specific read on the person and account, **so I can** personalize.

- "Very useful to nail my sales conversations!" (Carlos Echeverry, 5★, 2026-02-04, [CWS-Crystal])
- "this is a 20word summary of JSON that was generated using a clay table" ([BRaWouFUot0 01:02](https://youtu.be/BRaWouFUot0?t=62)). "Jason" in the caption is a mis-transcription of the prospect's name.
- "when I click into Scoops I could see what is happening at a given contacts company here I can see they are hiring for multiple roles" ([vFfP63BheKw 01:06](https://youtu.be/vFfP63BheKw?t=66))

### H1. Hygiene: don't break my browser or lock me out
This is a constraint, not a job, but it drives the most 1★ reviews. The R count of 31 combines 7 login reviews, 10 coexistence reviews and 14 "not working" reviews.

**When I** install a prospecting tool, **I want** it to log me in with what I already have, leave my other panels and pages alone, and still work after I use it, **so I don't** have to choose between it and the rest of my stack.

- "It won't log in even though I'm logged into Zoominfo on another tab. When I try to log in, the page just refreshes and doesn't log in." (Amanda Eager, 2★, 2026-07-23, [CWS-ZoomInfo])
- "by opening a side panel now, it closes another side panel I use constantly." (PNW BorderLAN, 1★, 2026-07-27, [CWS-ZoomInfo])
- "It stops working and needs to be shut down after every contact export." (Callum, 1★, 2026-07-21, [CWS-ZoomInfo])

**Not in the evidence:** almost no review asks for AI chat, territory scans or more data fields. Praise is about getting a result, and complaints are about friction. The exception is ZoomInfo, whose users missed fields they had relied on: HQ address, exact employee count, and the expandable overlay.

## Customer journey map

The stages follow the order the tutorials show. "Moment of truth" is the point where the evidence shows reps decide to keep or drop the tool.

### 1. Discover and install
- **Rep goal:** get the tool onto the browser quickly, often because a manager bought a seat.
- **Actions:** find the listing, Add to Chrome, open the puzzle menu, pin the icon. Every tutorial includes the pin step ([EEXffH9vL9w 00:33](https://youtu.be/EEXffH9vL9w?t=33), [jTxCWDqmmAs 01:06](https://youtu.be/jTxCWDqmmAs?t=66), [V9D2xcN9UMQ 00:34](https://youtu.be/V9D2xcN9UMQ?t=34)). Several start from the web app: "To download the ZoomInfo Chrome extension, you'll want to first log in to ZoomInfo Sales" ([EEXffH9vL9w 00:00](https://youtu.be/EEXffH9vL9w)).
- **Emotions and pain:** low stakes, but people are wary of extensions that won't go away: "it kept popping up despite removing it" (Mukesh Morwall, 1★, [CWS-Apollo]); "the extension is extremely persistent and showing to be impossible to remove" (Anthony McKenzie, 2★, [CWS-Wiza]).
- **What top tools do:** install from inside the web app; first run lands on a real profile (Evaboot notes ZoomInfo redirects to its CEO's LinkedIn, [UotsqmRWUY4 00:00](https://youtu.be/UotsqmRWUY4)).
- **Moment of truth:** the first page after install shows something useful, not an empty sign-in.

### 2. Connect and log in
- **Rep goal:** be signed in as the same account they use on the web.
- **Actions:** sign in or create an account; some require a work email ([yWhK8f9ipNY 02:16](https://youtu.be/yWhK8f9ipNY?t=136)); refresh the page so the widget appears ([UotsqmRWUY4 00:35](https://youtu.be/UotsqmRWUY4?t=35)).
- **Emotions and pain:** the highest-severity stage, with 7 reviews, 6 of them 1-2★. "not able to login to updated version of extension" ([CWS-ZoomInfo]). "The error message itself is incomplete and unclear" (Life Tricks, 1★, [CWS-Hunter]). "I login with Google account, it says "sign in with your google or workmail". OK, I sign in with my workmail, it still has same reminder" (Steven Li, 1★, [CWS-Wiza]). "[Error Code: MVS]" (Frank Hardy, 1★, [CWS-Wiza]). "contactout.com refused to connect" (Pelumi Akinlade, 1★, [CWS-ContactOut]).
- **What top tools do:** reuse the web-app session (ZoomInfo reads its `ziaccesstoken` cookie, per the teardown; its July failure was that session not being picked up). Exportly's pitch is that reps "don't actually need to log into Clay" ([BRaWouFUot0 00:31](https://youtu.be/BRaWouFUot0?t=31)).
- **Moment of truth:** "I'm already logged in on the other tab, why isn't this?" One failure here generates a 1★ review on its own.

### 3. Land on a page
- **Rep goal:** keep doing what they were doing (a profile, a search, a CRM record, a company site).
- **Actions:** they browse normally, and the tool shows a badge or tab. Kaspr's icon shows "a number four that means that we have four data points" ([P3eXEx60njk 00:00](https://youtu.be/P3eXEx60njk)). Apollo shows a "little yellow friend on the left hand side" ([JuWylXgnJRo 00:33](https://youtu.be/JuWylXgnJRo?t=33)).
- **Emotions and pain:** the tool taking space or slowing the page. "your webpage view shrinks even more because it has to make space for the extension on the side" (Kathleen Quilaga, 4★, [CWS-ZoomInfo]). "The silly side bar takes over the screen - closes any AI apps, and covers what you were looking at." (SVVG, 1★, [CWS-Surfe]). "It slows down your computer" (Lizzy Hosford, 2★, [CWS-HubSpot]).
- **What top tools do:** a passive badge with a count before any click (Kaspr). Hunter is a toolbar popup that does nothing until clicked.
- **Moment of truth (inference):** the rep can tell at a glance whether opening the tool is worth it on this page.

### 4. Recognize the person or company
- **Rep goal:** be sure the tool is looking at the same entity they are.
- **Actions:** open the panel and glance at the name, title and company (V9D2: "Take a moment to look over their headline and company information on the page so you know you're on the right profile", [00:34](https://youtu.be/V9D2xcN9UMQ?t=34)).
- **Emotions and pain:** "the extension sometimes says "No details for this contact in Surfe yet". It also can't find all companies in the page." (Mark Hashimoto, 2★, [CWS-Surfe]). "it doesnt always appear/arrive on the contact within LinkedIn" (Greg Thompson, 2★, [CWS-Surfe]). Clay builder: "it is repeating details of Managers, CEO and Email for other row" (efeobome igbogidi, 4★, [CWS-Clay]).
- **What top tools do:** Hunter keys off the domain, which is unambiguous. ZoomInfo and Apollo scrape the DOM, which is fast but fragile, and ZoomInfo's selectors are remote config for that reason (see the teardown).
- **Moment of truth:** a wrong or blank match on a page the rep can plainly see is a person reads as "broken".

### 5. Check what already exists
- **Rep goal:** avoid duplicates and repeat spend; see owner and history.
- **Actions:** read the "in CRM" indicator and the activity log ([EEXffH9vL9w 01:40, 02:12](https://youtu.be/EEXffH9vL9w?t=100)). Surfe highlights existing contacts in blue in search results ([qcSJF3PfT0E 03:52](https://youtu.be/qcSJF3PfT0E?t=232)). Exportly dedupes the buying committee against Salesforce ([X7XNqcOPpNg 02:09](https://youtu.be/X7XNqcOPpNg?t=129)).
- **Emotions and pain:** tools that skip this step leave reps wasting time and pasting by hand (Jeffrey Haley, [CWS-RocketReach]). Apollo told a customer to spend again on records they had already processed (Rowan Costello, [CWS-Apollo]).
- **What top tools do:** put the existing-record state at the top of the card, before the reveal button.
- **Moment of truth:** the rep learns, before spending, whether this person is new.

### 6. Enrich or reveal
- **Rep goal:** get email and phone, ideally verified, for a known and small cost.
- **Actions:** click reveal or "show details" per field or in bulk. "when you click the reveal button on a contact, it'll cost you one credit" ([5o0Xhi8uqus 06:02](https://youtu.be/5o0Xhi8uqus?t=362)). "we click show selected and it uses three credits" ([bd_WYcL84OQ 01:05](https://youtu.be/bd_WYcL84OQ?t=65)). Waterfall tools show progress: "it's waiting for drop contact" ([qcSJF3PfT0E 05:33](https://youtu.be/qcSJF3PfT0E?t=333)); "click these two buttons and start enrichment and boom" ([BRaWouFUot0 02:10](https://youtu.be/BRaWouFUot0?t=130)).
- **Emotions and pain:** "unable to reveal the search contacts details at all" (MC Crenergy, 1★, [CWS-Kaspr]); the preview promising data the reveal does not deliver ([CWS-RocketReach]); "Recently the extension has a delay when coming up with options" (Ashley Holmes, 4★, [CWS-Hunter]).
- **What top tools do:** one click, a result within seconds, and per-field status (Hunter's verified badge and confidence score). Hunter's free tier earns explicit praise: "best app so far to find mails without credits" (Tushar Parmar, 5★, [CWS-Hunter]).
- **Moment of truth:** the first reveal. Accuracy here sets the rep's opinion of the tool.

### 7. Act: save, push, sequence
- **Rep goal:** move the lead into the system where outreach happens.
- **Actions:** add to list, add to sequence, export to CRM or CSV, copy to clipboard. Every vendor tutorial shows this bar ([EEXffH9vL9w 01:40](https://youtu.be/EEXffH9vL9w?t=100), [jTxCWDqmmAs 02:12](https://youtu.be/jTxCWDqmmAs?t=132), [2ygHMhpVyLo 04:51](https://youtu.be/2ygHMhpVyLo?t=291), [P3eXEx60njk 01:05](https://youtu.be/P3eXEx60njk?t=65)). ZoomInfo's admin-configured target: "added to a prospecting list that is specific to me that was configured by my admin" ([vFfP63BheKw 02:11](https://youtu.be/vFfP63BheKw?t=131)). Kaspr lets the rep "edit your lead before it's saved" ([P3eXEx60njk 01:38](https://youtu.be/P3eXEx60njk?t=98)).
- **Emotions and pain:** the tool dying right after the action: "needs to be shut down after every contact export" ([CWS-ZoomInfo]); "these functions constantly disappear or seem to force me to refresh my page" ([CWS-HubSpot]); lemlist "has compatibility problems with HubSpot inbox" (Isabel Vega Suarez, 3★, [CWS-lemlist]).
- **What top tools do:** one click from result to destination, with the destination preset by an admin.
- **Moment of truth:** the second contact. If the tool works once and then needs a restart, reps leave.

### 8. Verify the result
- **Rep goal:** confirm it landed and the data holds up.
- **Actions:** open the CRM record from the link (Exportly returns "the HubSpot link to his profile", [BRaWouFUot0 04:53](https://youtu.be/BRaWouFUot0?t=293)); check the list in the web app ([jTxCWDqmmAs 02:47](https://youtu.be/jTxCWDqmmAs?t=167)); after a bounce or bad dial, refresh: "If, say, a rep calls somebody and the phone number is bad, they can do a Salesforce refresh to get a phone number" ([X7XNqcOPpNg 03:14](https://youtu.be/X7XNqcOPpNg?t=194)).
- **Emotions and pain:** bounces discovered later are blamed on the tool. Kaspr: "4 x email bounced back :s" (Carla, 3★, [CWS-Kaspr]).
- **What top tools do:** Exportly links back to the destination record and offers an explicit refresh for bad data. **(Inference:)** none of the reviewed tools reports outcomes back (bounced, replied).
- **Moment of truth:** the first bounce or wrong number, which is when the rep checks whether the tool said "verified".

### 9. Return later: history
- **Rep goal:** find someone they looked up yesterday without paying again.
- **Actions:** ZoomInfo tags "so you can grab the contacts and easily come back to them" ([EEXffH9vL9w 03:53](https://youtu.be/EEXffH9vL9w?t=233)). Hunter shows "the saved green check mark" and "go to my leads" ([rITlWiUSOmM 01:08, 01:42](https://youtu.be/rITlWiUSOmM?t=68)). Exportly has a "little mini CRM essentially called the people view. So you can search for anyone you've previously enriched" ([BRaWouFUot0 05:26](https://youtu.be/BRaWouFUot0?t=326)). Kaspr: "all leads are saved automatically to a default list" ([P3eXEx60njk 01:05](https://youtu.be/P3eXEx60njk?t=65)).
- **Emotions and pain:** Rowan Costello's 24-message thread over data "already processed" ([CWS-Apollo]) is this stage failing.
- **What top tools do:** auto-save every lookup and show the saved state the next time the page is visited.
- **Moment of truth (inference):** the second visit to the same profile shows what the rep already got, at no charge.

### 10. Admin and billing
- **Rep or admin goal:** control spend, destinations and data rules; reps want predictable allotments.
- **Actions:** in Exportly the admin provisions tables and the rep picks from them ("any clay table in the workspace that your um admin on the RevOps side has provisioned", [BRaWouFUot0 03:16](https://youtu.be/BRaWouFUot0?t=196)). "we control exactly what data actually flows back to the rep" ([X7XNqcOPpNg 01:04](https://youtu.be/X7XNqcOPpNg?t=64)). Surfe offers usage analytics per rep and one-click CRM field creation ([qcSJF3PfT0E 12:53, 16:49](https://youtu.be/qcSJF3PfT0E?t=773)).
- **Emotions and pain:** credit cliffs and surprise charges. "Credits burn fast. Every enrichment, every AI lookup, every data pull costs credits. Power users can blow through their monthly allocation in days" ([HKWiYe_DyOM 04:23](https://youtu.be/HKWiYe_DyOM?t=263), competitor source). Crystal: "I forgot about it. Until I saw the charge for another year" (Andrew Mirolli, 5★ for a prompt refund, [CWS-Crystal]). Pricing opacity: "you are uh forced to contact the sales team" ([UotsqmRWUY4 07:52](https://youtu.be/UotsqmRWUY4?t=472)).
- **What top tools do:** admins set the plays and destinations once, and reps see buttons.
- **Moment of truth:** the month a rep runs out of credits mid-week, or a manager sees spend they can't attribute.

## Scoring rubric for wireframe steps

Score each wireframe step, or the whole flow, from 1 to 5 on each criterion. 1, 3 and 5 are anchored; 2 and 4 are in between. The weighted total is the sum of weight × score, divided by 5, out of 100. A criterion that does not apply to a step is marked n/a and the total is rescaled.

| # | Criterion | Weight | 1 | 3 | 5 | Evidence |
|---|---|---|---|---|---|---|
| C1 | **Time and clicks to first useful result** | 14 | More than 3 clicks or more than 10 s before any data; or the rep must visit the web app | 2-3 clicks; result in 5-10 s with a visible progress state | Panel open plus 1 click gives a usable result in about 5 s or less; cached results show instantly | J2 (R 40, T 12); Surfe "1-2 clicks to 7-9" |
| C2 | **Shows existing data before spending** | 10 | No indication of the CRM, table or prior lookups | Shows "in CRM" or "seen before" without detail | Before any paid button: existing rows from my table and CRM, with owner and date, and a duplicate warning | J4; RocketReach "cannot see who I already have in SF"; ZoomInfo, Surfe, Exportly do this |
| C3 | **Data trust signal** | 10 | A bare value with no status | A verified/unverified flag | Per-field status (verified, catch-all, risky), source or provider, freshness date, and a one-click re-verify or refresh | J6 (R 15, T 9); Hunter rITl; Exportly refresh |
| C4 | **No separate login, clean auth recovery** | 9 | Separate credentials; failure loops or gives a cryptic error | Reuses the session, but failures are unclear or need a reload | Silently uses the web session; one explicit fallback (device approval); every failure names the cause and the fix | Stage 2: 7 reviews, 6 of them 1-2★; ZoomInfo "logged into Zoominfo on another tab" |
| C5 | **Coexists with the page and other tools** | 9 | Injects into the page, takes over or shrinks the screen, or forces a restart after use | Side panel only, but needs more than 400 px or degrades after repeated actions | Works at 320 px; opened by click only; the panel is still usable after every action; no page DOM touched | H1; ZoomInfo "closes another side panel", "shut down after every contact export"; HubSpot, lemlist conflicts |
| C6 | **Cost transparency** | 9 | Cost unknown until it is charged; charges on a miss or a repeat | Cost known from docs or a settings page | Cost shown on the button before the click, balance visible, "no charge if no match" or "already paid" stated | J8 (R 7, T 7); Kaspr "bait", RocketReach preview mismatch |
| C7 | **Act on the result in one step** | 9 | Only copy to clipboard or "view in web app" | Push to one destination, with more steps for others | One click to an admin-preset destination (CRM, sequence, list), plus click-to-copy, with a link back to the created record | J3 (T 15); Exportly "with one click", RocketReach copy-paste complaint |
| C8 | **Bulk path for searches and lists** | 7 | Per-profile only | Per-page capture (10 or 25 rows), repeated by hand | Whole search or list handed off server-side with a count, cost estimate and progress; rep can leave | J7 (T 10); Apollo and ZoomInfo page-by-page pain |
| C9 | **Persistence and history** | 7 | Result lives only in the open panel | Saved in the web app, not visible in the panel | Every lookup is saved automatically, searchable in the panel, survives closing it, and shows on the next visit to the page | Stage 9; Exportly people view, Hunter saved check, Kaspr default list |
| C10 | **Error and empty-state recovery** | 6 | Spinner forever, blank, or "something went wrong" | Generic error with retry | Specific states (no match, partial, provider failed, out of credits, page not recognized), each with a next action; no charge on failure | Hunter login error; Surfe "No details for this contact"; Kaspr "unable to reveal" |
| C11 | **Correct page recognition, visibly** | 5 | Guesses silently; wrong or blank entity on an obvious page | Shows the detected entity but the rep can't correct it | Shows exactly what was detected (type, name or slug, domain); lets the rep correct or paste a URL; unsupported pages say so | Stage 4; Surfe "doesnt always appear"; Clay repeated rows |
| C12 | **LinkedIn and account safety** | 3 | Reads or automates LinkedIn DOM, background scraping, auto-pagination | Reads DOM only on an explicit click | URL and title only; all fetching server-side; nothing a site can probe | lemlist "linkdin flags it as automation"; competitor-extensions.md LinkedIn section |
| C13 | **Keyboard and copy affordances** | 2 | Mouse only, no copy buttons | Copy buttons | Shortcut to open the panel and run the primary play; every value click-to-copy | ZoomInfo Cmd+J and click-to-copy ([EEXffH9vL9w 02:12](https://youtu.be/EEXffH9vL9w?t=132)) |
| | **Total** | **100** | | | | |

C12 carries a low weight because Deepline's architecture already satisfies it by construction. Keep it so that a wireframe adding "read the page" fails loudly.

### Worked example

Scores come from the reviews and transcripts above and the ZoomInfo teardown, not from hands-on use. **(Inference throughout.)**

| Criterion (weight) | ZoomInfo post-July 2026 | Apollo | Hunter |
|---|---|---|---|
| C1 Time to result (14) | 3: loads faster per its own 4★ reviewer, but "the overall work became slower because I now have to switch to the main website more often" | 5: one click, praised for speed | 5: one click on any domain lists emails |
| C2 Existing data first (10) | 5: "see if the record exists inside of your CRM" plus activity log | 3: activities and tasks shown; dedupe not evidenced | 3: "saved" check mark for own leads only |
| C3 Trust signal (10) | 3: A/A+ accuracy score exists (Prospeo claims 36% bounce on A+, competitor source) | 3: "verified" label (competitor claims 73% valid) | 5: verified badge, confidence score, sources, verify button |
| C4 Auth (9) | 1: login fails while logged in on another tab; refresh loop | 4: no auth complaints in sample | 3: work email required; incomplete login error |
| C5 Coexistence (9) | 1: closes other side panels, shrinks the page, must restart after export, content script on all URLs | 3: injected tab; "kept popping up despite removing it" | 5: toolbar popup, no coexistence complaints |
| C6 Cost transparency (9) | 2: credit per reveal, 10 free per month, opaque enterprise pricing | 3: free emails, 1/5-8 credits; "burn credits even on ... incorrect" | 4: 50 free per month, praised "without credits" |
| C7 Act in one step (9) | 3: CRM, Excel and tag export exist, but the extension crashes after export | 5: list, sequence and CRM from the panel | 3: save to Hunter leads lists |
| C8 Bulk (7) | 3: per page, 10 or 25 rows | 3: per page, 10 or 25 rows ("can't do that with this process") | 3: whole domain list, no search import |
| C9 History (7) | 3: tags and activity log | 4: saved into Apollo lists | 4: auto-saved leads, "go to my leads" |
| C10 Errors (6) | 1: no recovery, restart needed | 3: unknown in the extension; support loops (Rowan) | 2: login error "incomplete and unclear" |
| C11 Recognition (5) | 3: DOM scrape with remote selectors and AI fallback | 4: rarely questioned | 5: the domain is unambiguous |
| C12 LinkedIn safety (3) | 1: DOM scraping, fixed web-accessible URL | 2: injected widget; LinkedIn removed Apollo's page in 2025 | 4: domain-centric, minimal LinkedIn |
| C13 Keyboard and copy (2) | 5: Cmd+J, click-to-copy | 3 | 3 |
| **Weighted total** | **52** | **73** | **78** |
| CWS rating for reference | 1.6★ | 4.6★ | 4.8★ |

The order matches the CWS ratings. That is a sanity check, not validation: I knew the ratings while scoring. ZoomInfo loses mostly on C4, C5 and C10, which are the hygiene failures, while it wins C2 (existing data), the criterion Apollo and Hunter are weakest on. **A wireframe that gets ZoomInfo's C2 and Hunter's C3, C5 and C11 should score above 85.**

## Top 10 implications for the Deepline Assistant wireframes

These are mapped to the journeys (J1-J7) in [DESIGN.md](../DESIGN.md).

1. **Open on what we already have, not on a button (C2, J2/J6).** The first state on a recognized page should be "In your table: 2 rows, last run Oct 3 by you" or "New to your workspace", above the primary play button. This is the ZoomInfo strength worth copying and the RocketReach and Apollo failure worth avoiding. Add a CRM-presence play result here when the workspace has a CRM, which Frontier, Surfe and Unify all lead with.
2. **Put cost and outcome on the button (C6).** "Find email + phone · ~3 credits · no charge if no match". DESIGN.md defers credit estimates, but the evidence says this belongs in v1: price surprises and "bait" are among the most-cited 1★ themes for Kaspr and RocketReach. Also show balance somewhere persistent.
3. **Make repeat runs safe (C2/C6).** On a page with a completed row, the primary action should become "Re-run (refresh)", with the original result shown. This needs the missing `Idempotency-Key` (DESIGN.md server gaps). Disabling the button while a run is pending is not enough, because Apollo's paid-twice complaint is about later visits, not double clicks.
4. **Give every value a trust chip and a refresh (C3).** Email: verified / catch-all / risky plus the provider and date; phone: line type if known. Add a per-row "This bounced / wrong number → refresh" action, copied from the Exportly customer demo. That action is also a feedback signal Deepline can record.
5. **Wireframe the login failure states, not just the happy path (C4, J1).** Show: session found (no screen at all), session expired, wrong workspace, device-approval pending, and approval denied. Each needs a one-line cause and one button. Login is the single most damaging stage in the reviews.
6. **Design at 320 px and wireframe the post-action state (C5).** Every journey frame should show the panel after the action, still usable for the next profile. ZoomInfo's "shut down after every contact export" is the cautionary case. Assume another side panel (Gemini, Claude) is competing; never require the panel to stay open for a run to finish (J7 already handles this).
7. **Make search and list import the hero of J4 (C8).** Show the detected search, an estimated result count, a cost estimate and one "Import N people" action, with progress in My table. Page-by-page 10/25 capture is the most consistent pain in third-party tutorials. Server-side import is Deepline's clearest structural advantage, so the wireframe should make it obvious.
8. **Add at least one "act" step after the result (C7, J3).** The current journeys end at "rows in my table". Reps judge tools on handoff: copy, push to CRM, add to sequence or list. Each can be an admin-configured play button ("Send to HubSpot", "Add to Outreach sequence: Q4 VP Sales") that returns a link to the created record. Without this, the evidence predicts the RocketReach "copy and pasting emails" review.
9. **Show detected context explicitly and give unsupported pages a useful empty state (C10/C11).** Show "Detected: LinkedIn profile · /in/jane-doe", with "Not right? Paste a URL or domain". On unsupported pages show "Nothing to look up here", plus My table, never a blank panel. Each error state (no match, partial, provider down, out of credits) gets its own copy and is not charged. Sales Navigator lead URLs carry opaque IDs and the title may be the only name source; the wireframe should show what will happen when the name is unknown.
10. **Make My table the "people view" (C9, J6).** It should be searchable, show status per row, and update live, and a row clicked from any page should open its full result. Name it as the history feature. Exportly's customer and Kaspr's tutorial both treat "everyone I've looked up" as core. Keep the same fields a rep would otherwise go to the web app for (company HQ, employee count, domain): ZoomInfo's 1★ wave was partly about losing exactly those.

Smaller points for the wireframes:

- Keep a keyboard shortcut for open-and-run (C13).
- Don't auto-open the panel. Apollo's "kept popping up" review is the risk.
- Keep the panel copy free of anything that implies reading the page beyond the URL and title (C12).

[CWS-ZoomInfo]: https://chromewebstore.google.com/detail/zoominfo/fofjcndophjadilglgimelemjkjblgpf/reviews
[CWS-Apollo]: https://chromewebstore.google.com/detail/alhgpfoeiimagjlnfekdhkjlkiomcapa/reviews
[CWS-Lusha]: https://chromewebstore.google.com/detail/lusha-easily-find-b2b-con/mcebeofpilippmndlpcghpmghcljajna/reviews
[CWS-Hunter]: https://chromewebstore.google.com/detail/hunter-email-finder-exten/hgmhmanijnjhaffoampdlllchpolkdnj/reviews
[CWS-Kaspr]: https://chromewebstore.google.com/detail/kaspr-get-anyones-phone-n/kkfgenjfpmoegefcckjklfjieepogfhg/reviews
[CWS-ContactOut]: https://chromewebstore.google.com/detail/email-finder-by-contactou/jjdemeiffadmmjhkbbpglgnlgeafomjo/reviews
[CWS-Surfe]: https://chromewebstore.google.com/detail/kojhcdejfimplnokhhhekhiapceggamn/reviews
[CWS-lemlist]: https://chromewebstore.google.com/detail/khnbclggeggefodgimdekejhipkeobnc/reviews
[CWS-Crystal]: https://chromewebstore.google.com/detail/nmaonghoefpmlfgaknnboiekjhfpmajh/reviews
[CWS-RocketReach]: https://chromewebstore.google.com/detail/oiecklaabeielolbliiddlbokpfnmhba/reviews
[CWS-Clay]: https://chromewebstore.google.com/detail/acmfklpkefjlldbkdgmjoiknfgidadoh/reviews
[CWS-Wiza]: https://chromewebstore.google.com/detail/pjmlkdacmaejhkdcflncbpcpidkggoio/reviews
[CWS-HubSpot]: https://chromewebstore.google.com/detail/oiiaigjnkhngdbnoookogelabohpglmd/reviews
