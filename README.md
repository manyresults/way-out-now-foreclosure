# Way Out Now — Foreclosure Exit Plan

A five-question foreclosure assessment that captures the lead (GoHighLevel) and shows a
personalized results page: free resources, approved partner offers, and a strategy-session CTA.
Built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

## Notion-powered referrals

The results page reads its referral programs live from Notion, so editing a row there updates the quiz
(within ~5 minutes of cache) with no redeploy:

| Notion database | Used for | Columns read |
| --- | --- | --- |
| Free Referral Options | "Recommended Free Resources" | Agency, Type, Talking Point (falls back to Description), Referral Action / Link |
| Approved Affiliate Programs | "Approved Partner Programs" | Program Name, Category, Status, Best For (falls back to Description), Affiliate Link |

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
