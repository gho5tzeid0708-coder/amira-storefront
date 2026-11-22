export type Category = "plush" | "reversible" | "giftbox";

export type Variant = {
  id: string;
  product_id: string;
  color_name_en: string;
  color_name_ar: string;
  color_hex: string;
  stock_quantity: number;
};

export type Product = {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  category: Category;
  price_lyd: number;
  dimensions: string | null;
  care_instructions_en: string | null;
  care_instructions_ar: string | null;
  image_url: string | null;
  active: boolean;
  product_variants: Variant[];
};

export type BundleSlot = {
  product: Product;
  variant: Variant;
};

export type CartLine =
  | {
      key: string;
      kind: "product";
      name_en: string;
      name_ar: string;
      unit_price: number;
      qty: number;
      productId: string;
      variantId: string;
      colorEn: string;
      colorAr: string;
      colorHex: string;
    }
  | {
      key: string;
      kind: "bundle";
      name_en: string;
      name_ar: string;
      unit_price: number;
      qty: number;
      note: string;
      items: { productId: string; variantId: string; name_en: string; name_ar: string; colorHex: string }[];
    };

export type OrderStatus = "pending" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";

export type FulfillmentType = "delivery" | "pickup";
