# AMIRA — Winter Scarves & Shawls (Next.js + Supabase)

A bilingual storefront (Arabic-first, with an English toggle) for a Libya-based
winter scarf & shawl brand, with a real-time inventory backend, a
build-your-own gift-box bundle, and a two-mode Cash-on-Delivery checkout:
home delivery to 44 named areas (with an optional women's courier upgrade
where offered) or pickup from any of 79 branches. Includes a
password-protected admin dashboard for order and stock management.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (warm alabaster / soft stone / deep charcoal / wine-burgundy palette)
- Supabase (Postgres + RLS) for products, variants, orders, order items
- Server Actions for order placement and admin mutations (no separate API layer needed)

## 1. Set up Supabase
1. Create a project at supabase.com.
2. Open the SQL editor and run `supabase/schema.sql` once. It creates the
   tables (including the `fulfillment_type` / `female_courier` /
   `pickup_branch` columns on `orders`), Row Level Security policies, the
   `decrement_stock` function, and seeds 8 winter scarves across Plush Fringe
   Wraps / Reversible Shawls / Gift Box with color variants and starting stock.
3. From Project Settings → API, copy the Project URL, anon public key, and
   service role key.

## 2. Configure environment
```
cp .env.example .env.local
```
Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, and set `ADMIN_PASSWORD` to whatever you want to
use to sign into `/admin`.

## 3. Install & run
```
npm install
npm run dev
```
Visit `http://localhost:3000` for the storefront and `/admin` for the
dashboard.

## Architecture notes
- **Language**: Arabic/RTL is the default on first load (`components/providers.tsx`
  and the server-rendered `<html lang="ar" dir="rtl">` in `app/layout.tsx`); a
  saved preference in `localStorage` overrides it on return visits. The
  language toggle in the navbar switches to English/LTR.
- **Delivery & pickup pricing lives in code, not the database** —
  `lib/delivery-data.ts` holds the exact 44 home-delivery areas (with their
  standard fee and, where offered, a separate women's-courier fee) and the
  exact 79 pickup branches, transcribed verbatim from the brand's rate sheet.
  `components/CheckoutForm.tsx` renders searchable pickers over this data, and
  `app/actions.ts` re-validates the chosen area/branch and recomputes the fee
  server-side before charging it — the client's displayed fee is never trusted
  as-is. If rates change, edit `lib/delivery-data.ts` in one place; no
  migration needed, since `orders` only stores the resulting fee and the
  chosen area/branch's Arabic name as a label.
- **Two fulfillment modes**: `orders.fulfillment_type` is `'delivery'` or
  `'pickup'`. For delivery, `orders.city` holds the area name and
  `address_landmark` holds the street address (+ optional landmark);
  `pickup_branch` is null. For pickup, it's the reverse — `pickup_branch` holds
  the branch name, `city` is null, and there's no street address field in the
  UI. A check constraint in `schema.sql` enforces this pairing at the database
  level. `orders.female_courier` is only ever `true` when the chosen area
  actually offers a women's-courier price (enforced server-side regardless of
  what the client sends).
- **Public reads** (products, variants) and **public inserts** (orders, order
  items) go through the anon key under Row Level Security — see the policies
  at the top of `schema.sql`.
- **Stock decrement** on checkout runs through a `SECURITY DEFINER` Postgres
  function (`decrement_stock`), so the public checkout flow can safely reduce
  stock without being granted a general `UPDATE` on `product_variants`.
- **Admin dashboard** (`/admin`) is gated by `middleware.ts`, which checks a
  signed-in cookie set after a correct password (`app/admin/actions.ts`). The
  orders table shows fulfillment mode, destination (area or branch), and a
  women's-courier badge per order. Admin reads/writes use
  `lib/supabase/admin.ts`, a service-role client that bypasses RLS — it's only
  ever imported from server code under `app/admin/**`. If you'd rather have
  per-staff logins with audit trails, swap this password gate for Supabase
  Auth and add `authenticated`-only policies to `orders` / `order_items` in
  `schema.sql`.
- **Gift Box Builder** adds a single `is_bundle: true` cart line carrying all
  three chosen product/variant pairs in `bundle_details_json`; placing an
  order decrements stock for each of the three underlying variants. Pre-made
  Gift Box products (category `giftbox`) are excluded from the picker, since
  the builder is for assembling a custom 3-scarf set.
- **Phone validation** uses `/^0(91|92|93|94|95)\d{7}$/` for Libyan mobile
  numbers, enforced both client-side and again in the `placeOrder` server
  action.
- **Mobile / in-app browser compatibility** (Facebook, Instagram, TikTok):
  the cart drawer uses `h-[100dvh]` with a sticky, safe-area-padded footer
  (`env(safe-area-inset-bottom)`) so its action button is never hidden behind
  an in-app nav bar or the iOS home-indicator swipe area; a global rule in
  `app/globals.css` sets every `input`/`select`/`textarea` to `16px` so
  mobile Safari and in-app browsers never auto-zoom on focus.
- **Product images**: `products.image_url` is nullable. Seed data ships with
  it empty, and the UI falls back to an elegant gradient + line-art placeholder
  in the product's color — swap in real photography by setting `image_url`
  on each product (works with any HTTPS image host, including Supabase
  Storage; `next.config.mjs` already allowlists `*.supabase.co` and
  `images.unsplash.com`).

## Extending
- Add `app/api/webhooks` if you want to notify staff (e.g. WhatsApp/Telegram)
  on new orders — call it from the end of `placeOrder` in `app/actions.ts`.
- To support partial/full prepayment later, add a `payment_method` option in
  the checkout form and a corresponding column default change — the schema
  already has `payment_method` as a free-text column for this reason.
- To change a delivery area's or branch's fee, or add/remove one, edit the
  corresponding entry in `lib/delivery-data.ts` — no other file needs to change.
