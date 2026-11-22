"use server";

import { createClient } from "@/lib/supabase/server";
import { LIBYAN_PHONE_REGEX } from "@/lib/constants";
import { DELIVERY_AREAS, PICKUP_BRANCHES } from "@/lib/delivery-data";
import { CartLine, FulfillmentType } from "@/lib/types";

export type PlaceOrderInput = {
  name: string;
  phone: string;
  fulfillment: FulfillmentType;
  areaId?: string; // required when fulfillment === "delivery"
  femaleCourier?: boolean; // only honored when the area offers it
  branchId?: string; // required when fulfillment === "pickup"
  address?: string; // required when fulfillment === "delivery"
  landmark?: string;
  lines: CartLine[];
};

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; subtotal: number; deliveryFee: number; total: number }
  | { ok: false; error: "name" | "phone" | "area" | "branch" | "address" | "empty" | "order_insert_failed" | "items_insert_failed" };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const { name, phone, fulfillment, areaId, femaleCourier, branchId, address, landmark, lines } = input;

  if (!name.trim()) return { ok: false, error: "name" };
  if (!LIBYAN_PHONE_REGEX.test(phone.trim())) return { ok: false, error: "phone" };
  if (!lines.length) return { ok: false, error: "empty" };

  const area = fulfillment === "delivery" ? DELIVERY_AREAS.find((a) => a.id === areaId) : null;
  const branch = fulfillment === "pickup" ? PICKUP_BRANCHES.find((b) => b.id === branchId) : null;

  if (fulfillment === "delivery") {
    if (!area) return { ok: false, error: "area" };
    if (!address || !address.trim()) return { ok: false, error: "address" };
  } else {
    if (!branch) return { ok: false, error: "branch" };
  }

  const useFemaleCourier = fulfillment === "delivery" && !!femaleCourier && area!.womenFee != null;
  const deliveryFee =
    fulfillment === "pickup" ? branch!.fee : useFemaleCourier ? (area!.womenFee as number) : area!.standardFee;

  const subtotal = lines.reduce((s, l) => s + l.unit_price * l.qty, 0);
  const total = subtotal + deliveryFee;
  const orderNumber = `LY-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

  const supabase = createClient();

  const addressLandmark =
    fulfillment === "delivery"
      ? `${(address ?? "").trim()}${landmark?.trim() ? " — " + landmark.trim() : ""}`
      : landmark?.trim() || null;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_name: name.trim(),
      phone: phone.trim(),
      city: fulfillment === "delivery" ? area!.nameAr : null,
      address_landmark: addressLandmark,
      fulfillment_type: fulfillment,
      female_courier: useFemaleCourier,
      pickup_branch: fulfillment === "pickup" ? branch!.nameAr : null,
      subtotal_lyd: subtotal,
      delivery_fee_lyd: deliveryFee,
      total_lyd: total,
      payment_method: "COD",
      status: "pending"
    })
    .select("id")
    .single();

  if (orderErr || !order) return { ok: false, error: "order_insert_failed" };

  const itemRows = lines.map((l) =>
    l.kind === "product"
      ? {
          order_id: order.id,
          product_id: l.productId,
          variant_id: l.variantId,
          is_bundle: false,
          bundle_details_json: null,
          quantity: l.qty,
          unit_price_lyd: l.unit_price
        }
      : {
          order_id: order.id,
          product_id: null,
          variant_id: null,
          is_bundle: true,
          bundle_details_json: { note: l.note, items: l.items },
          quantity: l.qty,
          unit_price_lyd: l.unit_price
        }
  );

  const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
  if (itemsErr) return { ok: false, error: "items_insert_failed" };

  // Decrement stock for every variant touched (individual lines + each bundle slot),
  // via a SECURITY DEFINER function so the public insert flow doesn't need elevated access.
  const decrements: { variantId: string; qty: number }[] = [];
  for (const l of lines) {
    if (l.kind === "product") decrements.push({ variantId: l.variantId, qty: l.qty });
    else for (const item of l.items) decrements.push({ variantId: item.variantId, qty: l.qty });
  }
  await Promise.all(
    decrements.map((d) => supabase.rpc("decrement_stock", { p_variant_id: d.variantId, p_qty: d.qty }))
  );

  return { ok: true, orderNumber, subtotal, deliveryFee, total };
}
