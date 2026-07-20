# SMW

Social-media scheduling and automation — Content Studio (Claude-generated drafts),
per-platform Automation rules, Accounts, Calendar, and real Stripe Billing. Built with
Next.js 16 (App Router), Prisma 7 + Neon Postgres, Auth.js (Credentials + JWT), the
Anthropic API, and Stripe. Live at **https://smw-blond.vercel.app**.

Platform posting is currently mocked (`src/lib/connectors/mock.ts`) behind a
`PlatformConnector` interface — real OAuth integrations (Meta, X, LinkedIn, TikTok,
YouTube) drop in later without touching the scheduling engine, API routes, or UI.

## Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) Postgres project (free tier is fine)
- An [Anthropic API key](https://console.anthropic.com/)
- A [Stripe](https://dashboard.stripe.com/) account (test mode is fine)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables** — copy `.env.example` to `.env` and fill in:

   | Variable              | Where to get it                                                                                                            |
   | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
   | `DATABASE_URL`        | Neon dashboard → Connect → **pooled** connection string (hostname contains `-pooler`)                                      |
   | `DIRECT_DATABASE_URL` | Same page → **direct** connection string (no `-pooler`) — used only for migrations                                         |
   | `AUTH_SECRET`         | Generate with `openssl rand -base64 32` (or `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`) |
   | `ANTHROPIC_API_KEY`   | [console.anthropic.com](https://console.anthropic.com/) → Settings → API Keys                                              |
   | `ANTHROPIC_MODEL`     | Defaults to `claude-sonnet-5` if unset — safe to leave as-is                                                               |
   | `CRON_SECRET`         | Any random string — shared secret the cron trigger sends to `/api/cron/publish`                                            |
   | `STRIPE_SECRET_KEY`   | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) → secret key (test mode, `sk_test_...`)               |

   `STRIPE_PORTAL_CONFIGURATION_ID` and `STRIPE_WEBHOOK_SECRET` come from steps 4 and 5 below — leave them blank for now.

3. **Run the first migration and seed a demo user**

   ```bash
   npx prisma migrate dev --name init
   npm run db:seed
   ```

   Seeds `demo@smw.app` / `password123` with 3 connected platforms and automation
   rules matching the original design mock, so the app has real data to show
   immediately.

4. **Create the Stripe products/prices/billing-portal config** (idempotent — safe to re-run)

   ```bash
   npm run stripe:setup
   ```

   Prints a `STRIPE_PORTAL_CONFIGURATION_ID` — add it to `.env`.

5. **Create the Stripe webhook** pointing at wherever the app is reachable (your deployed
   URL, or an `ngrok`/`stripe listen` tunnel for local testing) via the
   [Stripe dashboard](https://dashboard.stripe.com/webhooks) → Add endpoint, URL
   `<your-url>/api/stripe/webhook`, events `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted`. Copy the signing
   secret into `.env` as `STRIPE_WEBHOOK_SECRET`.

6. **Run it**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000), which redirects to `/login`.

## Scripts

| Command                           | Purpose                                                          |
| --------------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                     | Start the dev server                                             |
| `npm run build`                   | Production build (also runs typecheck)                           |
| `npm run lint`                    | ESLint                                                           |
| `npm run format` / `format:check` | Prettier write / check                                           |
| `npm run typecheck`               | `tsc --noEmit`                                                   |
| `npm test`                        | Run the Vitest unit suite                                        |
| `npm run db:migrate`              | `prisma migrate dev`                                             |
| `npm run db:studio`               | Open Prisma Studio against Neon                                  |
| `npm run db:seed`                 | Re-run the seed script                                           |
| `npm run stripe:setup`            | Create/verify Stripe products, prices, and billing portal config |

## Architecture notes

- **Prisma 7** uses the driver-adapter model (`@prisma/adapter-pg`), not the classic
  schema-level `datasource.url` — connection strings live in `prisma.config.ts`
  (migrations, via `DIRECT_DATABASE_URL`) and `src/lib/prisma.ts` (runtime, via the
  pooled `DATABASE_URL`). The generated client lives at `src/generated/prisma`
  (gitignored, regenerated by the `postinstall` script).
- **`src/proxy.ts`** is Next.js 16's renamed `middleware.ts` — same mechanism, new
  filename. It gates the `(dashboard)` route group and bounces logged-in users away
  from `/login` and `/register`.
- **Auth** is Credentials + JWT only (no OAuth login, no adapter/session tables) —
  see `src/lib/auth.ts`.
- **The automation engine** (`src/app/api/cron/publish/route.ts`) does two things per
  invocation: publishes any due `SCHEDULED` post, and — for each enabled automation
  rule whose time slot is due — pulls the oldest `DRAFT` post for that platform from
  the content pipeline and publishes it. No draft ready → the slot is skipped. Slot
  due-ness (`isSlotDue`, `src/lib/scheduling/engine.ts`) uses a 10-minute tolerance
  window, and `AutomationFireLog` (a unique constraint on rule + day + slot) makes
  each slot claimable exactly once per day, so an overlapping or retried cron
  invocation can't double-fire it.
- **Triggering the cron endpoint**: `.github/workflows/cron-publish.yml` polls every
  5 minutes via GitHub Actions (Vercel Hobby's cron is capped at once/day, too coarse
  for multiple automation slots). The workflow step is gated behind a `CRON_ENABLED`
  repo variable so it no-ops instead of failing on every run until the app is
  actually deployed. To enable once deployed:
  1. Set repo secrets `APP_URL` (your deployed URL) and `CRON_SECRET` (same value as
     the app's `CRON_SECRET` env var).
  2. Set the repo variable `CRON_ENABLED` to `true`.
- **Connectors**: `src/lib/connectors/registry.ts` maps each `PlatformId` to a
  connector implementing `PlatformConnector` (`connect`/`disconnect`/`publish`/
  `checkStatus`). Every entry is `MockConnector` today; swapping in a real API means
  writing a new class and changing one line in the registry.
- **Billing** is real Stripe Checkout (`/api/billing/checkout`) for a first
  subscription and the Stripe customer billing portal (`/api/billing/portal`) for
  switching plans, updating payment methods, or canceling — no custom
  upgrade/downgrade/proration logic of our own. `src/app/api/stripe/webhook/route.ts`
  is the single source of truth for `User.plan`/`billingCycle`/`stripeSubscriptionId`,
  driven by `checkout.session.completed`, `customer.subscription.updated`, and
  `customer.subscription.deleted`. `scripts/setup-stripe.ts` is the idempotent,
  re-runnable setup for the Stripe-side Products/Prices/portal config — Product and
  Price IDs are never hardcoded; the app looks them up at runtime by `lookup_key`
  (`src/lib/stripe/plans.ts`).

## Deployment

Live on Vercel at **https://smw-blond.vercel.app**, deployed via the Vercel CLI
(`vercel --prod`) with all env vars pushed to Production/Preview/Development through
`vercel env add`. The GitHub repo isn't yet connected for auto-deploy-on-push — that
needs a one-time authorization in the Vercel dashboard (Project → Settings → Git →
Connect Git Repository) that the CLI can't complete non-interactively; until then,
ship changes with `vercel --prod` from a clean working tree.

The Stripe webhook endpoint is registered against the production URL specifically —
if the production domain ever changes, re-run the webhook creation step (or update the
existing endpoint's URL in the Stripe dashboard) and update `STRIPE_WEBHOOK_SECRET`
everywhere it's set.
