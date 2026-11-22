import { OrderStatus } from "./types";

export const BUNDLE_PRICE = 135;
export const BUNDLE_SIZE = 3;

export const LIBYAN_PHONE_REGEX = /^0(91|92|93|94|95)\d{7}$/;

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled"
];

export const CATEGORIES: { key: "all" | "plush" | "reversible" | "giftbox"; en: string; ar: string }[] = [
  { key: "all", en: "All", ar: "الكل" },
  { key: "plush", en: "Plush Fringe Wraps", ar: "أوشحة شتوية ناعمة" },
  { key: "reversible", en: "Reversible Shawls", ar: "شالات وجهين" },
  { key: "giftbox", en: "Gift Box (3 Scarves)", ar: "بوكس الهدايا (3 أوشحة)" }
];

// Small pill badge shown on each product card, next to the dimensions badge.
export const CATEGORY_TAG: Record<"plush" | "reversible" | "giftbox", { en: string; ar: string }> = {
  plush: { en: "Winter Plush", ar: "شتوي ناعم" },
  reversible: { en: "Reversible", ar: "وجهان" },
  giftbox: { en: "Gift Set", ar: "طقم هدايا" }
};

// Quick-select shortcuts shown above the searchable area picker (by area id, see lib/delivery-data.ts)
export const QUICK_AREA_IDS = ["a01", "a29", "a23", "a13"]; // Tripoli, Benghazi, Misrata, Zawiya
