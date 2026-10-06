# Live data connections (Supabase backend)

Status: written against the official API documentation (checked October 2026). **Not yet run against live Google, Bing or Supabase accounts.** Expect to fix small things on first contact. The data mappers are unit tested (`npm test`); the network calls are not.

## What it pulls

| Source | Auth | Datasets written | Notes |
| --- | --- | --- | --- |
| Google Search Console | Google OAuth (`webmasters.readonly`) | `gsc_daily`, `gsc_queries`, `gsc_pages` | Last 28 days of queries and pages, daily rows merged into history |
| Google Analytics 4 | Google OAuth (`analytics.readonly`) | `ga4_daily`, `ga4_channels` | Uses the `keyEvents` metric, falls back to `conversions` |
| Google Business Profile | Google OAuth (`business.manage`) | `gbp_daily` | Needs approved Business Profile API access, see below |
| Google Ads | Google OAuth (`adwords`) | `ads_daily` | Customer-level daily cost, clicks, impressions, conversions |
| Bing Webmaster Tools | API key (no OAuth) | `bing_daily`, `bing_queries`, `bing_pages` | Bing returns query and page stats as weekly buckets with no date filter |

Not connected (use CSV import): Microsoft Advertising, Meta Ads, rank trackers. AI visibility stays a manual log: AI assistants have no official API that reports whether and how a brand is mentioned in consumer answers.

Pulled data is written into the same `documents` rows the CSV import produces, so the dashboard updates live through its normal realtime subscription.

## One-time setup

1. **Database:** run `supabase/schema.sql` (it includes the connection tables). Optionally run `supabase/cron.sql` after deploying.
2. **Google Cloud project:** create one, then
   - enable the Search Console API, Google Analytics Data API, Google Analytics Admin API, Business Profile Performance API, My Business Account Management API, My Business Business Information API and Google Ads API;
   - configure the OAuth consent screen with the four scopes above;
   - create an OAuth client (type Web application) with the authorised redirect URI `https://<PROJECT-REF>.supabase.co/functions/v1/google-callback`.
3. **Approvals Google requires before this works for other people's accounts:**
   - **OAuth verification** for sensitive and restricted scopes. Until verified, only listed test users can connect.
   - **Business Profile API access** has to be requested and approved separately.
   - **Google Ads API access level** now attaches to the Cloud project (developer tokens were sunset on 9 September 2026). Apply for at least Explorer access on the project's Google Ads API Overview page. A Test-level project cannot read production accounts.
4. **Secrets:** set these on the Supabase project (`supabase secrets set NAME=value`):

   | Name | Value |
   | --- | --- |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | From the OAuth client |
   | `TOKEN_ENC_KEY` | 32 random bytes, base64 (`openssl rand -base64 32`). Encrypts stored tokens. Losing it means everyone reconnects |
   | `STATE_SECRET` | Any long random string. Signs the OAuth state |
   | `APP_URL` | Where the dashboard is hosted, for example `https://dashboard.example.com/` |
   | `APP_ORIGIN` | The same origin, used for CORS |
   | `CRON_SECRET` | Random string used by the scheduler (only if you use cron) |
   | `GOOGLE_ADS_API_VERSION` | Optional. Defaults to `v25`. Confirm the current version in the Google Ads API release notes |
5. **Deploy:** `supabase functions deploy connect google-callback sync` and merge `supabase/config.toml` into your project config.
6. **Per client:** fill in the identifiers on **Client info** (Search Console property, GA4 property ID, Business Profile location ID, Google Ads customer ID, Bing site URL), then use **Live connections**. The Find buttons list what the connected Google account can see, so IDs do not need typing.

## Security model

- The browser only ever sees safe connection metadata. Refresh tokens and API keys are AES-GCM encrypted and stored in `connection_secrets`, which has no row level security policies, so only the edge functions can read it.
- Every function call checks the caller's JWT and organization membership. The scheduler uses a shared secret instead.
- The OAuth `state` is signed and expires after 10 minutes.
- Each source asks only for the single read-only scope it needs (Business Profile has no read-only scope, so `business.manage` is requested; the code only reads).

## Known unverified items

Checked against current official documentation: Search Console `searchAnalytics.query`, GA4 `runReport`, Business Profile `fetchMultiDailyMetricsTimeSeries` and its metric names, Google Ads `searchStream` and the developer token sunset, Bing `GetQueryStats`, `GetPageStats` and `GetRankAndTrafficStats`.

Written from memory or secondary sources, so check first when something fails:

- Google Ads current API version (`v25` per third-party sources and release notes seen October 2026).
- GA4 metric name `keyEvents` (the code retries with `conversions` on a 400).
- Business Profile response nesting (`multiDailyMetricTimeSeries` > `dailyMetricTimeSeries` > `timeSeries.datedValues`).
- Discovery endpoints (GA4 `accountSummaries`, Business Profile accounts and locations, Google Ads `listAccessibleCustomers`).
- Bing daily totals have no date filter, and weekly query buckets are keyed to Pacific time.
- The edge function time limit for large backfills. The first sync pulls 90 days; later syncs pull 7.
