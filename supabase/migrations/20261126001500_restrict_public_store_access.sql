create or replace function public.place_order_secure(
  p_order_number text,
  p_customer_name text,
  p_phone text,
  p_fulfillment_type text,
  p_female_courier boolean,
  p_city text,
  p_pickup_branch text,
  p_address_landmark text,
  p_delivery_fee_lyd numeric,
  p_lines jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_line jsonb;
  v_saved_line jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_stock integer;
  v_price numeric(10,2);
  v_subtotal numeric(10,2) := 0;
  v_saved_lines jsonb := '[]'::jsonb;
  v_order_id uuid;
begin
  if p_order_number is null or length(trim(p_order_number)) = 0
    or p_customer_name is null or length(trim(p_customer_name)) = 0
    or p_phone is null or length(trim(p_phone)) = 0
    or p_delivery_fee_lyd is null or p_delivery_fee_lyd < 0 or p_delivery_fee_lyd > 1000
    or jsonb_typeof(p_lines) is distinct from 'array'
    or jsonb_array_length(p_lines) = 0
    or jsonb_array_length(p_lines) > 50 then
    raise exception using errcode = 'P0001', message = 'invalid_order';
  end if;

  if p_fulfillment_type = 'delivery' then
    if p_city is null or length(trim(p_city)) = 0 or p_pickup_branch is not null then
      raise exception using errcode = 'P0001', message = 'invalid_destination';
    end if;
  elsif p_fulfillment_type = 'pickup' then
    if p_pickup_branch is null or length(trim(p_pickup_branch)) = 0 or p_city is not null then
      raise exception using errcode = 'P0001', message = 'invalid_destination';
    end if;
  else
    raise exception using errcode = 'P0001', message = 'invalid_fulfillment';
  end if;

  for v_line in select value from jsonb_array_elements(p_lines) as item(value) loop
    if jsonb_typeof(v_line) is distinct from 'object' then
      raise exception using errcode = 'P0001', message = 'invalid_cart_line';
    end if;

    begin
      v_product_id := (v_line ->> 'productId')::uuid;
      v_variant_id := (v_line ->> 'variantId')::uuid;
      v_quantity := (v_line ->> 'qty')::integer;
    exception
      when invalid_text_representation or numeric_value_out_of_range then
        raise exception using errcode = 'P0001', message = 'invalid_cart_line';
    end;

    if v_product_id is null or v_variant_id is null or v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception using errcode = 'P0001', message = 'invalid_cart_line';
    end if;

    select p.price_lyd, pv.stock_quantity
      into v_price, v_stock
      from public.products p
      join public.product_variants pv on pv.product_id = p.id
      where p.id = v_product_id and pv.id = v_variant_id and p.active = true
      for update of pv;

    if not found then
      raise exception using errcode = 'P0001', message = 'product_unavailable';
    end if;
    if v_stock < v_quantity then
      raise exception using errcode = 'P0001', message = 'insufficient_stock';
    end if;

    update public.product_variants
      set stock_quantity = stock_quantity - v_quantity
      where id = v_variant_id and stock_quantity >= v_quantity;
    if not found then
      raise exception using errcode = 'P0001', message = 'insufficient_stock';
    end if;

    v_subtotal := v_subtotal + (v_price * v_quantity);
    v_saved_lines := v_saved_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product_id,
      'variant_id', v_variant_id,
      'quantity', v_quantity,
      'unit_price_lyd', v_price
    ));
  end loop;

  insert into public.orders (
    order_number, customer_name, phone, fulfillment_type, female_courier,
    city, pickup_branch, address_landmark, subtotal_lyd, delivery_fee_lyd,
    total_lyd, payment_method, status
  ) values (
    trim(p_order_number), trim(p_customer_name), trim(p_phone), p_fulfillment_type,
    coalesce(p_female_courier, false), p_city, p_pickup_branch, p_address_landmark,
    v_subtotal, p_delivery_fee_lyd, v_subtotal + p_delivery_fee_lyd, 'COD', 'pending'
  ) returning id into v_order_id;

  for v_saved_line in select value from jsonb_array_elements(v_saved_lines) as item(value) loop
    insert into public.order_items (
      order_id, product_id, variant_id, is_bundle, bundle_details_json, quantity, unit_price_lyd
    ) values (
      v_order_id,
      (v_saved_line ->> 'product_id')::uuid,
      (v_saved_line ->> 'variant_id')::uuid,
      false,
      null,
      (v_saved_line ->> 'quantity')::integer,
      (v_saved_line ->> 'unit_price_lyd')::numeric
    );
  end loop;

  return jsonb_build_object(
    'order_number', trim(p_order_number),
    'subtotal_lyd', v_subtotal,
    'delivery_fee_lyd', p_delivery_fee_lyd,
    'total_lyd', v_subtotal + p_delivery_fee_lyd
  );
end;
$$;

revoke all privileges on table public.products, public.product_variants, public.orders, public.order_items
  from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on table public.products, public.product_variants to anon, authenticated;

drop policy if exists "Public can place orders" on public.orders;
drop policy if exists "Public can add order_items" on public.order_items;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.place_order_secure(
  text, text, text, text, boolean, text, text, text, numeric, jsonb
) to service_role;
grant execute on function public.decrement_stock(uuid, integer) to service_role;
