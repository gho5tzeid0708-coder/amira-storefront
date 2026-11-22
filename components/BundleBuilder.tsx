"use client";

import { useState } from "react";
import { Check, Gift } from "lucide-react";
import { Product, Variant } from "@/lib/types";
import { BUNDLE_PRICE, BUNDLE_SIZE } from "@/lib/constants";
import { useLanguage, useCart } from "./providers";

type Slot = { product: Product | null; variant: Variant | null };

export default function BundleBuilder({ products: allProducts }: { products: Product[] }) {
  const { lang, t } = useLanguage();
  const { addBundle } = useCart();
  const products = allProducts.filter((p) => p.category !== "giftbox");
  const [slots, setSlots] = useState<Slot[]>(Array.from({ length: BUNDLE_SIZE }, () => ({ product: null, variant: null })));
  const [note, setNote] = useState("");
  const [justAdded, setJustAdded] = useState(false);

  const setSlotProduct = (i: number, productId: string) => {
    const product = products.find((p) => p.id === productId) ?? null;
    const firstVariant = product?.product_variants.find((v) => v.stock_quantity > 0) ?? null;
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { product, variant: firstVariant } : s)));
  };

  const setSlotVariant = (i: number, variantId: string) => {
    setSlots((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, variant: s.product?.product_variants.find((v) => v.id === variantId) ?? null } : s))
    );
  };

  const filledSlots = slots.filter((s) => s.product && s.variant);
  const complete = filledSlots.length === BUNDLE_SIZE;
  const individualTotal = filledSlots.reduce((sum, s) => sum + (s.product?.price_lyd ?? 0), 0);
  const savings = complete ? Math.max(0, individualTotal - BUNDLE_PRICE) : 0;

  const handleAdd = () => {
    if (!complete) return;
    addBundle(
      filledSlots.map((s) => ({ product: s.product as Product, variant: s.variant as Variant })),
      note
    );
    setSlots(Array.from({ length: BUNDLE_SIZE }, () => ({ product: null, variant: null })));
    setNote("");
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
  };

  return (
    <section id="gift-box" className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-stone/50 rounded-2xl p-6 sm:p-10">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="text-wine" />
          <h2 className="font-serif text-2xl sm:text-3xl">{t.bundleTitle}</h2>
        </div>
        <p className="opacity-75 mb-6 max-w-xl">{t.bundleSub}</p>
        <p className="text-sm mb-6">
          {t.bundlePriceLabel}: <span className="text-wine font-semibold">{BUNDLE_PRICE} د.ل</span>
        </p>

        {/* progress tracker */}
        <div className="flex items-center gap-2 mb-6">
          {slots.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div
                className={
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 " +
                  (s.product && s.variant ? "bg-wine text-white" : "bg-white border border-hairline")
                }
              >
                {s.product && s.variant ? <Check size={16} /> : i + 1}
              </div>
              {i < BUNDLE_SIZE - 1 && <div className={"h-0.5 flex-1 " + (s.product ? "bg-wine" : "bg-hairline")} />}
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {slots.map((slot, i) => (
            <div key={i} className="bg-white rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide opacity-60 mb-2">
                {t.slot} {i + 1}
              </p>
              <select
                value={slot.product?.id ?? ""}
                onChange={(e) => setSlotProduct(i, e.target.value)}
                className="w-full border border-hairline rounded-lg p-2 text-base mb-2 bg-white"
              >
                <option value="">{t.chooseScarf}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {lang === "en" ? p.name_en : p.name_ar} — {p.price_lyd} د.ل
                  </option>
                ))}
              </select>
              {slot.product && (
                <select
                  value={slot.variant?.id ?? ""}
                  onChange={(e) => setSlotVariant(i, e.target.value)}
                  className="w-full border border-hairline rounded-lg p-2 text-base bg-white"
                >
                  <option value="">{t.chooseColor}</option>
                  {slot.product.product_variants.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.stock_quantity <= 0}>
                      {(lang === "en" ? v.color_name_en : v.color_name_ar) + (v.stock_quantity <= 0 ? ` (${t.outOfStockShort})` : "")}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        {complete && (
          <p className="text-sm mb-4">
            {t.savings}: <span className="text-wine font-semibold">{savings} د.ل</span>
          </p>
        )}

        <label className="text-xs opacity-60 block mb-1">{t.giftNote}</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.giftNotePlaceholder}
          rows={2}
          className="w-full border border-hairline rounded-lg p-3 text-base mb-4 bg-white"
        />

        <button
          disabled={!complete}
          onClick={handleAdd}
          className="w-full sm:w-auto bg-charcoal text-cream rounded-full px-8 py-2.5 hover:bg-wine transition-colors disabled:opacity-40"
        >
          {justAdded ? "✓" : t.addBundle}
        </button>
      </div>
    </section>
  );
}
