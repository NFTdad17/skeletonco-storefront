# Skeleton Co

Minimal print-on-demand storefront for a Printify shop. It is a Next.js App Router app aimed at Vercel. There are no accounts and no database. The cart stays in the browser.

## Setup

1. Clone the repo.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env.local` in the project root and fill in these four variables:

   ```bash
   PRINTIFY_API_TOKEN=
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

   Open the URL Next prints, usually http://localhost:3000.

## Where the keys go

**Printify token.** `PRINTIFY_API_TOKEN` is a personal access token from the Printify account (My account, Connections, API). The shop id is `27129548`. The token is read only on the server, in `lib/printify.ts`. Do not prefix it with `NEXT_PUBLIC_`, and do not import that module from a client component.

**Stripe secret key.** `STRIPE_SECRET_KEY` comes from the Stripe Dashboard, under Developers, API keys. `/api/checkout` uses it to create a Checkout Session in payment mode. Keep it on the server.

**Stripe webhook secret.** `STRIPE_WEBHOOK_SECRET` is the signing secret for the webhook endpoint (`whsec_...`), from the Stripe Dashboard or from `stripe listen` while developing locally. `/api/webhook` uses it to verify the `Stripe-Signature` header. Keep it on the server.

**Stripe publishable key.** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is the publishable key from the same Stripe API keys page. It is safe to expose to the browser. Checkout currently redirects to Stripe's hosted page using the session URL from the server, so this key is not required for that redirect.

## Deploy

Import the project in Vercel and set the same four variables in the project environment settings.

Checkout collects a shipping address, then Stripe takes payment and redirects to `/success`. `/api/webhook` verifies the signature, reads the address from the Checkout Session metadata, and creates the Printify order. Printify expects that address on `address_to`.
