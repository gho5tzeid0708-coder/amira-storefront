-- ============================================================
-- AMIRA storefront schema — run this once in the Supabase SQL editor
-- ============================================================
create extension if not exists pgcrypto;

-- ---------- PRODUCTS ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  description_en text,
  description_ar text,
  category text not null check (category in ('plush','reversible','giftbox')),
  price_lyd numeric(10,2) not null,
  dimensions text,
  care_instructions_en text,
  care_instructions_ar text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- PRODUCT VARIANTS (colors + stock) ----------
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  color_name_en text not null,
  color_name_ar text not null,
  color_hex text not null,
  stock_quantity int not null default 0
);

-- ---------- ORDERS ----------
-- city / address_landmark are nullable: a branch-pickup order has neither a
-- delivery area nor a street address. pickup_branch is nullable the other way.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  phone text not null,
  fulfillment_type text not null default 'delivery' check (fulfillment_type in ('delivery','pickup')),
  female_courier boolean not null default false,
  city text,              -- delivery area's Arabic name; null for pickup orders
  pickup_branch text,     -- branch's Arabic name; null for delivery orders
  address_landmark text,  -- street address (+ landmark) for delivery; optional note for pickup
  subtotal_lyd numeric(10,2) not null,
  delivery_fee_lyd numeric(10,2) not null,
  total_lyd numeric(10,2) not null,
  payment_method text not null default 'COD',
  status text not null default 'pending'
    check (status in ('pending','confirmed','out_for_delivery','delivered','cancelled')),
  created_at timestamptz not null default now(),
  constraint fulfillment_matches_destination check (
    (fulfillment_type = 'delivery' and city is not null and pickup_branch is null) or
    (fulfillment_type = 'pickup' and pickup_branch is not null and city is null)
  )
);

-- ---------- ORDER ITEMS (single scarves or 3-piece gift bundles) ----------
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  is_bundle boolean not null default false,
  bundle_details_json jsonb,
  quantity int not null default 1,
  unit_price_lyd numeric(10,2) not null
);

-- ---------- Row Level Security ----------
alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Public can read active products" on products
  for select using (active = true);

create policy "Public can read variants" on product_variants
  for select using (true);

create policy "Public can place orders" on orders
  for insert with check (true);

create policy "Public can add order items" on order_items
  for insert with check (true);

-- No public select/update policy on orders/order_items: the storefront never
-- needs to read them back, and the admin dashboard uses the service-role key,
-- which bypasses RLS entirely. If you switch /admin to Supabase Auth instead
-- of the password gate, add authenticated-only select/update policies here.

-- ---------- Stock decrement (runs as owner, so it works under the public
-- insert policy above without granting anon a general UPDATE on variants) ----------
create or replace function decrement_stock(p_variant_id uuid, p_qty int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update product_variants
  set stock_quantity = greatest(stock_quantity - p_qty, 0)
  where id = p_variant_id;
end;
$$;

grant execute on function decrement_stock(uuid, int) to anon, authenticated;

-- Delivery-area and pickup-branch prices are NOT stored in the database —
-- they live in lib/delivery-data.ts (transcribed verbatim from the brand's
-- rate sheet) and are re-validated server-side in app/actions.ts on every
-- order. This keeps the 44-area / 79-branch rate sheet easy to diff/update
-- in one place without a migration. orders.city / orders.pickup_branch store
-- the chosen area/branch's Arabic name as a plain label for the admin view.

-- ============================================================
-- Seed data — Winter Plush collection: 8 scarves across
-- Plush Fringe Wraps / Reversible Shawls / Gift Box
-- ============================================================
do $$
declare
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid; p7 uuid; p8 uuid;
begin
  insert into products (name_en,name_ar,description_en,description_ar,category,price_lyd,dimensions,care_instructions_en,care_instructions_ar)
    values ('Alpine Fringe Wrap','وشاح ألباين المزخرف بالشراشيب','Plush winter wrap with a soft fringed edge.','وشاح شتوي ناعم بحواف مزخرفة بالشراشيب.','plush',95,'190 x 70 cm','Hand wash cold, lay flat to dry. Do not wring.','يُغسل باليد بماء بارد ويُترك ليجف مفرودًا. يُمنع العصر.')
    returning id into p1;
  insert into products (name_en,name_ar,description_en,description_ar,category,price_lyd,dimensions,care_instructions_en,care_instructions_ar)
    values ('Highland Plush Wrap','وشاح هايلاند الناعم','Heavier plush weave for deep winter warmth.','نسيج ناعم وسميك لدفء شديد في الشتاء.','plush',90,'190 x 70 cm','Hand wash cold, lay flat to dry. Do not wring.','يُغسل باليد بماء بارد ويُترك ليجف مفرودًا. يُمنع العصر.')
    returning id into p2;
  insert into products (name_en,name_ar,description_en,description_ar,category,price_lyd,dimensions,care_instructions_en,care_instructions_ar)
    values ('Nordic Fringe Scarf','وشاح نورديك المزخرف','Lightweight plush scarf with fringed ends.','وشاح ناعم خفيف الوزن بأطراف مزخرفة بالشراشيب.','plush',85,'190 x 70 cm','Hand wash cold, lay flat to dry.','يُغسل باليد بماء بارد ويُترك ليجف مفرودًا.')
    returning id into p3;
  insert into products (name_en,name_ar,description_en,description_ar,category,price_lyd,dimensions,care_instructions_en,care_instructions_ar)
    values ('Reversible Wool-Blend Shawl','شال الصوف المزدوج الوجهين','Two looks in one — wear either side out.','إطلالتان في قطعة واحدة — يمكن ارتداؤه من الوجهين.','reversible',110,'185 x 75 cm','Dry clean recommended. Spot clean reversible seams carefully.','يُفضّل التنظيف الجاف. تُنظّف الخياطة الداخلية بعناية عند الحاجة.')
    returning id into p4;
  insert into products (name_en,name_ar,description_en,description_ar,category,price_lyd,dimensions,care_instructions_en,care_instructions_ar)
    values ('Two-Tone Reversible Shawl','شال وجهين بتدرجين','Reversible shawl pairing two complementary tones.','شال بوجهين يجمع بين لونين متناسقين.','reversible',105,'185 x 75 cm','Dry clean recommended. Spot clean reversible seams carefully.','يُفضّل التنظيف الجاف. تُنظّف الخياطة الداخلية بعناية عند الحاجة.')
    returning id into p5;
  insert into products (name_en,name_ar,description_en,description_ar,category,price_lyd,dimensions,care_instructions_en,care_instructions_ar)
    values ('Classic Reversible Wrap','وشاح كلاسيك بوجهين','A timeless reversible wrap for everyday winter wear.','وشاح كلاسيكي بوجهين للارتداء اليومي في الشتاء.','reversible',100,'185 x 75 cm','Dry clean recommended.','يُفضّل التنظيف الجاف.')
    returning id into p6;
  insert into products (name_en,name_ar,description_en,description_ar,category,price_lyd,dimensions,care_instructions_en,care_instructions_ar)
    values ('Winter Luxe Gift Box','بوكس الشتاء الفاخر','A pre-styled luxury winter gift box, ready to give.','بوكس هدايا شتوي فاخر وجاهز للإهداء.','giftbox',160,'Gift box — 30 x 20 x 10 cm','See individual fabric care instructions inside.','راجعي تعليمات العناية الخاصة بكل قماش داخل البوكس.')
    returning id into p7;
  insert into products (name_en,name_ar,description_en,description_ar,category,price_lyd,dimensions,care_instructions_en,care_instructions_ar)
    values ('Fireside Gift Box Duo','بوكس فايرسايد المزدوج','A cozy two-scarf gift box for winter giving.','بوكس هدايا يضم وشاحين دافئين للشتاء.','giftbox',130,'Gift box — 25 x 18 x 8 cm','See individual fabric care instructions inside.','راجعي تعليمات العناية الخاصة بكل قماش داخل البوكس.')
    returning id into p8;

  -- Color palette: Wine Red #6E1E2A, Cloud White #F5F3EF, Dark Grey #4A4A4A,
  -- Blush Pink #D9A9A0, Navy Blue #1F2A44
  insert into product_variants (product_id,color_name_en,color_name_ar,color_hex,stock_quantity) values
    (p1,'Wine Red','أحمر نبيذي','#6E1E2A',14),(p1,'Cloud White','أبيض سحابي','#F5F3EF',11),(p1,'Dark Grey','رمادي داكن','#4A4A4A',9),
    (p2,'Navy Blue','كحلي','#1F2A44',10),(p2,'Blush Pink','وردي فاتح','#D9A9A0',8),(p2,'Dark Grey','رمادي داكن','#4A4A4A',12),
    (p3,'Wine Red','أحمر نبيذي','#6E1E2A',13),(p3,'Navy Blue','كحلي','#1F2A44',0),
    (p4,'Wine Red','أحمر نبيذي','#6E1E2A',9),(p4,'Cloud White','أبيض سحابي','#F5F3EF',11),
    (p5,'Dark Grey','رمادي داكن','#4A4A4A',10),(p5,'Blush Pink','وردي فاتح','#D9A9A0',12),
    (p6,'Navy Blue','كحلي','#1F2A44',14),(p6,'Cloud White','أبيض سحابي','#F5F3EF',10),
    (p7,'Wine Red','أحمر نبيذي','#6E1E2A',8),
    (p8,'Navy Blue','كحلي','#1F2A44',7);
end $$;
