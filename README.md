# 42nd Street Marketing, SEO and AI Visibility Dashboard

A client reporting dashboard for agencies. Import exports from Google Search Console, Bing Webmaster Tools, GA4, Google Business Profile and ad platforms, track AI visibility, keywords, service areas and main services, and keep every client's profile in one place.

No framework and no runtime dependencies. The app builds to a single `dist/index.html`.

## What it does

- **Overview, Google and Bing, Website traffic, Local and paid:** period KPIs with comparison to the previous period, charts, sortable tables, branded vs non-branded split and growth opportunities.
- **Client info:** one form for everything the agency needs to know about a client (business profile, contacts, listings, tracking IDs, website and tech, brand, goals, competitors, engagement). It never stores passwords.
- **Keywords and areas:** the keywords, service areas and main services you track for a client, matched automatically to imported Search Console and Bing exports (position, impressions, clicks, CTR), plus a rank log and rank history for ranks from a rank tracker or map checks.
- **AI visibility:** log prompts tested in ChatGPT, Claude, Gemini, Perplexity, Copilot and Google AI features, then see mention and citation rates, a prompt coverage grid and competitors named.
- **Technical and schema:** a checklist for `@graph` and `@id` schema, sitemaps, IndexNow, AI crawler access and AEO content structure.
- **Live connections:** connect a client's Google Search Console, GA4, Business Profile, Google Ads and Bing Webmaster Tools and the data pulls itself (Supabase backend only, see below).
- **Data and workspace:** CSV import with automatic header matching, logo upload, backup and restore, clients.

All figures come from the exports you import. Nothing is estimated or invented. The "Load sample client" button creates a clearly labelled client with invented numbers for previews.

## Quick start

Full walkthrough for GitHub and a free Supabase test database: **SETUP.md**.

```bash
npm install          # only needed for tests (jsdom)
npm run build        # writes dist/index.html
npm run serve        # builds and serves dist/ locally
npm test             # builds and runs the smoke tests
```

With no configuration the app runs in **demo mode**: data is saved in the browser only.

## Storage architecture

All persistence goes through a small "doc store" interface (`doc(path).get/set/delete/onSnapshot`, `collection(path).get/onSnapshot`). Three adapters implement it, and the app picks one at start-up (`initStorage` in `src/js/02-state.js`):

| Adapter | File | Used when | Status |
| --- | --- | --- | --- |
| claude.ai | native `db` capability | Published as a claude.ai artifact | Works inside claude.ai |
| Supabase | `src/adapters/supabase.js` | `supabaseUrl` and `supabaseAnonKey` set in `src/config.js` | **Reference implementation, not yet run against a live project** |
| Local | `src/adapters/local.js` | Nothing else available | Tested, demo only |

Data layout: `agency/main` (logo), `clients/<id>` (profile, info, tracking lists, checklist), `clients/<id>/data/<dataset>-<n>` (imported rows, split into chunks that stay under 256 KiB), and `data/users/<uid>/prefs` (private UI preferences).

### Setting up Supabase

1. Create a **test** Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Under Authentication, enable email sign-in and add your site URL to the redirect list.
4. Copy `src/config.example.js` to `src/config.js` and fill in the project URL and anon key. The anon key is meant to be public; the row level security policies are what protect data. Never use the `service_role` key in the browser.
5. `npm run build`, serve `dist/`, sign in with your email.

Before any real client data goes in, review the policies and try to read another organization's data from a second account.

### Running as a claude.ai artifact

Publish `dist/index.html` as an artifact with these capabilities: `db` (with `rules` of `read: "interact"`, `write: "interact"` so view-only guests cannot read client data), `user` and `downloads`. The `db` and `downloads` capabilities only exist inside claude.ai.

## Live data connections

The `supabase/functions` folder holds three edge functions that handle Google sign-in, store the tokens encrypted, and pull data into the same documents the CSV import writes:

- `connect`: starts Google sign-in, saves a Bing API key, finds account IDs, disconnects.
- `google-callback`: receives Google's redirect and stores the refresh token.
- `sync`: pulls the data. Called from the Live connections page, or daily by the scheduler (`supabase/cron.sql`).

Connectors exist for Search Console, GA4, Business Profile, Google Ads and Bing Webmaster Tools. Microsoft Advertising, Meta Ads and rank trackers stay on CSV import, and AI visibility stays a manual log. Setup, required Google approvals, secrets and the list of unverified items are in `supabase/README.md`. **The connectors have never run against live accounts.** The mapping code is unit tested (`tests/connectors.test.mjs`), the network calls are not.

## Project layout

```
src/index.html        page template
src/styles.css        design tokens (42st.com charcoal and gold) and components
src/js/01..09-*.js    app modules, concatenated in order by build.mjs (07b is the Live connections page)
src/assets/logo.png   default logo, inlined into the build (replace it to rebrand)
src/adapters/*.js     storage adapters
src/config.example.js copy to src/config.js (git-ignored)
supabase/schema.sql   tables, row level security, bootstrap function, connection tables
supabase/functions/   connect, google-callback and sync edge functions plus shared code
supabase/cron.sql     optional daily refresh
tests/run.mjs         jsdom smoke tests (local adapter, a fake claude.ai db, the connections UI against a mock backend)
tests/connectors.test.mjs  unit tests for the API data mappers
build.mjs             zero-dependency build to dist/index.html
```

## Known gaps before this is a SaaS

- **Auth and organizations:** sign-in is email link only, every new user without membership gets their own organization, and there is no invite screen. Add an invite flow before teammates join.
- **API connections:** built but unproven. Before real clients: finish Google's OAuth verification, get Business Profile API access and a Google Ads API access level approved, and run each connector against a test account. Microsoft Advertising and Meta Ads are not built.
- **Billing, plans and limits:** not built.
- **Audit log, data export and account deletion:** not built. Check what your clients' contracts and local privacy law require.
- **Multi-tenant hardening:** add rate limits, a Content Security Policy for your own hosting and automated tests against a real Supabase project.
- **Client data:** the app stores business contact details, tracking IDs and budgets entered by your team. Keep passwords and card numbers out of it.

## Before you publish the repository

- Keep it **private** until the licence is decided. A public repository with no licence file is all rights reserved by default.
- Do not commit `src/config.js`, real exports or backups. `.gitignore` already excludes `src/config.js` and `dist/`.
- The 42nd Street name and the logo you upload are your brand assets. If the repository becomes public or open source, decide whether to ship the logo and name with it.
- The font is Afacad via Google Fonts (SIL Open Font License). There are no other third-party libraries in the app.
