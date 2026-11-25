"use server";

import { createAdminClient } from "@/lib/supabase/admin";
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
  | { ok: false; error: "name" | "phone" | "area" | "branch" | "address" | "empty" | "stock" | "order_insert_failed" };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (!input || typeof input !== "object") return { ok: false, error: "empty" };
  const { name, phone, fulfillment, areaId, femaleCourier, branchId, address, landmark, lines } = input;

  if (!name.trim()) return { ok: false, error: "name" };
  if (!LIBYAN_PHONE_REGEX.test(phone.trim())) return { ok: false, error: "phone" };
  if (!Array.isArray(lines) || !lines.length || lines.length > 50) return { ok: false, error: "empty" };
  if (
    lines.some(
      (line) =>
        !line ||
        typeof line.productId !== "string" ||
        typeof line.variantId !== "string" ||
        !Number.isInteger(line.qty) ||
        line.qty <= 0 ||
        line.qty > 99
    )
  ) {
    return { ok: false, error: "empty" };
  }

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

  const orderNumber = `LY-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

  const supabase = createAdminClient();

  const addressLandmark =
    fulfillment === "delivery"
      ? `${(address ?? "").trim()}${landmark?.trim() ? " — " + landmark.trim() : ""}`
      : landmark?.trim() || null;

  const { data, error } = await supabase.rpc("place_order_secure", {
    p_order_number: orderNumber,
    p_customer_name: name.trim(),
    p_phone: phone.trim(),
    p_fulfillment_type: fulfillment,
    p_female_courier: useFemaleCourier,
    p_city: fulfillment === "delivery" ? area!.nameAr : null,
    p_pickup_branch: fulfillment === "pickup" ? branch!.nameAr : null,
    p_address_landmark: addressLandmark,
    p_delivery_fee_lyd: deliveryFee,
    p_lines: lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      qty: line.qty
    }))
  });

  if (error) {
    if (error.message.includes("insufficient_stock") || error.message.includes("product_unavailable")) {
      return { ok: false, error: "stock" };
    }
    return { ok: false, error: "order_insert_failed" };
  }

  const result = data as {
    order_number?: unknown;
    subtotal_lyd?: unknown;
    delivery_fee_lyd?: unknown;
    total_lyd?: unknown;
  } | null;
  if (
    !result ||
    typeof result.order_number !== "string" ||
    typeof result.subtotal_lyd !== "number" ||
    typeof result.delivery_fee_lyd !== "number" ||
    typeof result.total_lyd !== "number"
  ) {
    return { ok: false, error: "order_insert_failed" };
  }

  return {
    ok: true,
    orderNumber: result.order_number,
    subtotal: result.subtotal_lyd,
    deliveryFee: result.delivery_fee_lyd,
    total: result.total_lyd
  };
}
