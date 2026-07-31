# gracechen.studio

Painting portfolio + print shop for the artist **Grace Chen**, to be deployed at
[gracechen.studio](https://gracechen.studio).

A quiet, editorial, gallery-like site: a script wordmark, a frosted-glass intro
card, and a signature **ruler-scrub gallery** on the homepage — hover (or drag,
on touch) along the engraved ruler to browse the artworks, one tick per piece.
The shop supports real checkout via **Stripe Checkout**.

---

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** (CSS-based theme; tokens in `src/app/globals.css`)
- **next/font** (Beth Ellen for the script wordmark/tagline; Helvetica stack for UI)
- **next/image** for all imagery (local assets in `public/assets/`)
- **Stripe** (hosted Checkout Sessions) for payments

---

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#    then edit .env.local and add your Stripe TEST keys (see below)

# 3. Run the dev server
npm run dev        # http://localhost:3000

# Production build / lint
npm run build
npm run lint
```

---

## Environment variables

Copy `.env.example` → `.env.local` (gitignored) and fill in real values. **Never
commit secrets.**

| Variable | Required | Description |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | for checkout | Stripe **secret** key. Use a `sk_test_…` key in dev. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | optional | Stripe publishable key (`pk_test_…`). Reserved for future client use. |
| `NEXT_PUBLIC_SITE_URL` | recommended | Public base URL. `http://localhost:3000` locally; `https://gracechen.studio` in prod. Used for SEO `metadataBase` and Stripe success/cancel redirects. |

Get test keys from the Stripe dashboard → **Developers → API keys** (toggle
**Test mode**): <https://dashboard.stripe.com/test/apikeys>

> The site builds and runs **without** Stripe keys. Checkout will simply return a
> friendly "not configured yet" message instead of crashing.

---

## How the shop & cart work

- **Catalog** — a typed product list in `src/data/products.ts` (originals + prints).
- **Cart** — a React Context (`src/context/CartContext.tsx`) wrapped around the
  app in `src/app/layout.tsx`, **persisted to `localStorage`**. It drives the
  live `CART (n)` count in the nav.
- **Add to cart** — from any product page (`/shop/[slug]`).
- **Checkout** — `/cart` POSTs the cart to `src/app/api/checkout/route.ts`, which
  builds Stripe `line_items` and creates a **Checkout Session** (`mode: payment`),
  then redirects the browser to Stripe's hosted page.
  - `success_url` → `/shop/success` (clears the cart)
  - `cancel_url` → `/shop`

### Test a purchase (Stripe test mode)

Use Stripe's test card `4242 4242 4242 4242`, any future expiry, any CVC/ZIP.

---

## Pages

| Route | Description |
| --- | --- |
| `/` | Homepage — wordmark, nav, frosted intro card, ruler-scrub filmstrip gallery |
| `/paintings`, `/drawings`, `/textiles` | Section gallery pages |
| `/about` | Short bio |
| `/shop` | Product grid |
| `/shop/[slug]` | Product detail + add to cart |
| `/cart` | Cart + Stripe checkout |
| `/shop/success` | Order confirmation (clears cart) |
| `not-found` | On-brand 404 |

### Design system

Reusable pieces live in `src/components/` (`Nav`, `Footer`, `Container`,
`PageShell`/`PageHeader`, `GalleryGrid`, `ui/Button`) with color + font tokens in
`src/app/globals.css`, so every page shares the same rhythm.

---

## Deploy to Vercel + connect the gracechen.studio domain

### 1. Push to GitHub

```bash
# from the project root
git init            # (already initialized)
git add -A
git commit -m "Initial commit"
# create a repo on github.com, then:
git remote add origin https://github.com/<you>/gracechen.studio.git
git branch -M main
git push -u origin main
```

### 2. Import into Vercel

1. Go to <https://vercel.com/new> and **import** the GitHub repo.
2. Framework preset is auto-detected as **Next.js** — no build config needed.
3. Before the first deploy, add **Environment Variables** (Project → Settings →
   Environment Variables):
   - `STRIPE_SECRET_KEY` = your `sk_live_…` (or `sk_test_…` to stay in test mode)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = your `pk_live_…` / `pk_test_…`
   - `NEXT_PUBLIC_SITE_URL` = `https://gracechen.studio`
4. Deploy.

### 3. Add the domain

In **Project → Settings → Domains**, add `gracechen.studio` (and `www.gracechen.studio`).

Then set DNS at your registrar to the records **Vercel shows you**. Typically:

| Type | Name | Value |
| --- | --- | --- |
| `A` | `@` (apex) | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

> Always follow the **exact** records Vercel displays for your project — they are
> authoritative and may differ. DNS can take up to ~48h to propagate; Vercel
> issues the SSL certificate automatically once records resolve.

---

## Notes

- Placeholder imagery is used throughout (`public/assets/`); swap in real work later.
- Secrets are kept out of git via `.gitignore` (`.env*.local` ignored, `.env.example` tracked).
