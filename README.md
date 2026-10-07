# Polaris

**A small store with many sellers.** Everyday clothing, accessories and things for the home from independent sellers, with one bag and one checkout. Sellers apply, an admin reviews them, and each seller lists and ships their own goods from a shared studio.

**Live:** [polarisstore.vercel.app](https://polarisstore.vercel.app) · Payments run in Stripe test mode: pay with `4242 4242 4242 4242`, any future date, any CVC.

## What it does

- **Shop.** Eight departments, three merchandised shelves (new arrivals, weekly picks, sale) and search. Filters for colour, size and shelf live in the URL, so every view can be shared and works without client-side state.
- **Product pages that follow the shopper.** Pick a colour and the gallery moves to that colour's photos. Sizes that are sold out in that colour are struck through, not hidden. Low stock is called out.
- **One bag for everyone.** The bag is stored on the server for guests (via an httpOnly cookie) and for signed-in shoppers, and a guest bag folds into the account on sign-in.
- **Checkout with Stripe.** Totals are computed on the server from database prices (13% HST, free shipping over $100). A paid order is completed by the Stripe webhook or by the return page, whichever arrives first. Completion is idempotent: it reduces stock and clears the bag exactly once.
- **Accounts.** Order history with per-item tracking, profile and password changes, account deletion, and the application form to become a seller.
- **The studio,** for sellers and admins. An overview with revenue, orders and best sellers; a product editor with photo upload (resized in the browser, stored on S3), colours, sizes and a stock grid; and an order queue where each seller ships only their own lines. Admins also review seller applications and can promote, demote or suspend accounts.
- **Built to be found.** Static, prerendered catalogue pages, per-product metadata and Product structured data, a sitemap, robots rules and a generated share image.

## Stack

Next.js 16 (App Router, Cache Components, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL (Neon) · Prisma 7 · Better Auth · Stripe Checkout · AWS S3 · Radix UI · Motion · Zod · Vitest

## Run it locally

You need Node 22.12 or newer and Docker.

```bash
npm install
cp .env.example .env.local      # then fill in the blanks (see below)
npm run db:up                   # Postgres 18 in Docker on port 5434
npx prisma migrate deploy       # create the tables
npm run db:seed                 # 26 products, 8 sellers, 4 months of orders
npm run dev                     # http://localhost:3000
```

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before seeding to get an admin account, or promote any account later with `npm run make-admin -- you@example.com`.

To see webhooks locally, run `stripe listen --forward-to localhost:3000/api/webhooks` and put the secret it prints in `STRIPE_WEBHOOK_SECRET`. Checkout works without it, because the return page completes the order.

| Variable | Used for |
| --- | --- |
| `DATABASE_URL` | Postgres for the app (Neon's pooled URL in production) |
| `DATABASE_URL_UNPOOLED` | Direct connection for migrations, set by the Neon integration |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Sessions; the URL is the site's public address |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Checkout and payment confirmation |
| `AWS_S3_REGION`, `AWS_S3_BUCKET_NAME`, `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY` | Photos sellers upload |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Optional admin account created by the seed |

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deploy to Vercel

1. In the Vercel project, add a Neon Postgres database from the Storage tab. It sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
2. Add the remaining variables from the table above.
3. Deploy. The `vercel-build` script generates the Prisma client, applies migrations, seeds the catalogue if the database is empty, then builds.
4. In Stripe, point a webhook at `https://<your-domain>/api/webhooks` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired` and `checkout.session.async_payment_failed`.

## Where things live

- `src/app/(store)` the shop: home, departments, product pages, bag, account, help
- `src/app/(auth)` sign in and sign up
- `src/app/studio` the seller and admin studio
- `src/app/api` Better Auth, the Stripe webhook and the checkout return route
- `src/actions` server actions (bag, checkout, account, studio, admin), each checking who's calling
- `src/server` data reads: the cached catalogue, the bag, orders, studio queries, checkout completion
- `src/lib` auth, sessions and roles, pricing, money, the catalogue vocabulary, storage
- `prisma` schema, migrations, and the seed with the launch catalogue
- `public/products` product photography, normalised to 4:5 WebP

First built in 2024 on MongoDB; rebuilt in 2026 on Postgres with a new design.

Built by [Sujan Rokad](https://sujanrokad.com) and Jay Patel.
