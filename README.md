# Way Out Now — Foreclosure Exit Plan

A five-question foreclosure assessment that captures the lead (GoHighLevel) and shows a
personalized results page: free resources, approved partner offers, and a strategy-session CTA.
Built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

## Notion-powered referrals

The results page reads its referral programs live from Notion, so editing a row there updates the quiz
(within ~5 minutes of cache) with no redeploy:

| Notion database | Used for | Columns read |
| --- | --- | --- |
| Free Referral Options | "Recommended Free Resources" | Agency, Type, Talking Point, Referral Action / Link, plus optional Display Name and Description for Website |
| Approved Affiliate Programs | "Approved Partner Programs" | Program Name, Category, Status, Best For, Affiliate Link, plus optional Display Name and Description for Website |

- **Client-facing wording:** add a text column **Description for Website** (and optionally **Display Name**) to either database. When filled they are shown to homeowners instead of Program Name / Agency and Best For / Talking Point (which stay as your internal notes). A trailing tag like `[Aggregate]` in the name is hidden automatically.
- **Only affiliate rows whose `Status` contains "Approved" or "Live" are shown.** "Not yet approved" or blank rows are never shown to homeowners.
- Routing (which `Type`/`Category` fires for which answers) lives in `src/lib/routing.ts` and follows the *Find Your Way Out — Lead Magnet Spec*.
- The browser calls `/api/referrals` (`api/referrals.ts` on Vercel; the same code is served by the Vite dev server). The Notion token never reaches the browser.
- If the endpoint is unreachable or the token is missing, the quiz falls back to the snapshot in `src/data/defaultReferrals.ts`.

### Setup

1. Create an internal integration at <https://www.notion.so/profile/integrations> and copy its secret.
2. In Notion, open each of the two databases > ••• > Connections > add the integration.
3. `cp .env.example .env` and set `NOTION_TOKEN` locally; set the same variables in your host's environment settings (Vercel > Project > Settings > Environment Variables).
4. Set `NEXT_PUBLIC_BOOKING_URL` to the strategy-session calendar link.

To route a new affiliate category (e.g. Legal Services), add the row in Notion with Status "Approved"; `affiliateIntent` in `src/lib/routing.ts` decides when each category is shown.

## GoHighLevel (lead delivery)

When someone finishes the quiz, the browser posts to `/api/submit`. The server saves their answers under a
`/results/<id>` link, builds the payload below and POSTs it to your GHL **Inbound Webhook** (retrying up to 3
times). If GHL cannot be reached the visitor sees an error and can retry, so a lead is never silently dropped.

**Setup**
1. In GHL: Automation > Workflows > new workflow > trigger **Inbound Webhook**. Copy its URL.
2. In Vercel > Settings > Environment Variables add `GHL_WEBHOOK_URL` (Production, and Preview if you want
   test deploys to work). Do not prefix it with `NEXT_PUBLIC_`. Redeploy.
3. Submit one fake lead. In the workflow trigger, fetch the sample request so GHL learns the field names.
4. Add a **Create/Update Contact** action and map the fields below (standard fields use GHL's own names).

**Payload** (flat JSON)

| Field | Example |
| --- | --- |
| `event`, `schema_version`, `submitted_at` | `foreclosure_quiz_completed`, `1`, ISO timestamp |
| `first_name`, `last_name`, `full_name`, `email` | `Jane`, `Doe`, `Jane Doe`, `jane@example.com` (email lowercased) |
| `phone` / `phone_raw` | `+12155550100` (E.164 for US numbers) / as typed |
| `foreclosure_status`, `payments_behind`, `sale_date_set`, `goal` | answer codes, e.g. `pre` |
| `..._label` versions of the four above | readable text, e.g. `Keep the house` |
| `hardships` / `hardships_labels` | `["income","divorce"]` / `Income loss / job change, ...` |
| `results_url`, `results_id` | `https://<site>/results/a1b2c3d4`, `a1b2c3d4` |
| `results_badge`, `results_headline` | the headline the visitor saw |
| `resources`, `partners` | arrays of `{ name, category, link }` |
| `resources_text`, `partners_text` | `- Name: link` lines, ready for a custom field or email |
| `landing_url`, `referrer`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `fbclid` | only present when set |

A hidden spam-trap field on the form silently drops most bots.

## Personal results links

When someone finishes the quiz, their answers are saved under a random 8-character hex id and they land on
`/results/<id>`. The link never expires, the page always shows the current Notion referrals, and the same
link is stored on the contact in GoHighLevel ("Results URL"). Only the quiz answers are stored (no name, email
or phone).

- Storage is Upstash Redis from the Vercel Marketplace: Vercel project > **Storage** > **Create Database** >
  **Upstash for Redis** > connect it to the project, then redeploy. It adds `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` (or the `KV_REST_API_*` equivalents) automatically.
- If storage is missing or down, the quiz still completes and falls back to the old
  `/thank-you?data=...` link, so lead capture is never blocked. Old `/thank-you` links keep working.
- `/results/*` is `noindex` and disallowed in `robots.txt`.

## Requirements

- Node.js 18+ (LTS recommended)
- npm

## Getting started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

## Available scripts

- `npm run dev` - start Vite in development mode
- `npm run build` - create a production build
- `npm run build:dev` - create a development-mode build
- `npm run preview` - preview the production build locally
- `npm run lint` - run ESLint checks
- `npm run test` - run Vitest tests once
- `npm run test:watch` - run Vitest in watch mode

## Verification commands

Use these to verify repository health:

```bash
npm run lint
npm run test
npm run build
npx tsc --noEmit
```

## Lockfile policy

This repository does not track `package-lock.json`.
