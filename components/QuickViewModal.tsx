"use client";

import { useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import { Product } from "@/lib/types";
import { useLanguage, useCart } from "./providers";
import ColorSwatches from "./ColorSwatches";
import { CATEGORY_TAG } from "@/lib/constants";

export default function QuickViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { lang, t } = useLanguage();
  const { addProduct } = useCart();
  const variants = product.product_variants;
  const [active, setActive] = useState(variants.find((v) => v.stock_quantity > 0) ?? variants[0]);
  const [qty, setQty] = useState(1);
  const hex = active?.color_hex ?? "#6E1E2A";
  const outOfStock = !active || active.stock_quantity <= 0;
  const name = lang === "en" ? product.name_en : product.name_ar;
  const care = lang === "en" ? product.care_instructions_en : product.care_instructions_ar;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-cream rounded-2xl max-w-lg w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 end-4" aria-label="Close">
          <X />
        </button>
        <div
          className="h-40 rounded-xl mb-4 flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${hex}22, ${hex}55)` }}
        >
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={name} className="h-full w-full object-cover" />
          ) : (
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke={hex} strokeWidth="1">
              <path
                d="M4 7c3 3 6-3 9 0s6-3 9 0M4 13c3 3 6-3 9 0s6-3 9 0M4 19c3 3 6-3 9 0s6-3 9 0"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
        <h2 className="font-serif text-xl mb-1">{name}</h2>
        <div className="flex gap-1.5 flex-wrap mb-2">
          {product.dimensions && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone border border-hairline">{product.dimensions}</span>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone border border-hairline">
            {lang === "en" ? CATEGORY_TAG[product.category].en : CATEGORY_TAG[product.category].ar}
          </span>
        </div>
        <p className="text-wine font-medium mb-3">
          {product.price_lyd} د.ل <span className="text-xs opacity-60 font-normal">— {t.inStock(active?.stock_quantity ?? 0)}</span>
        </p>
        <div className="mb-3">
          <p className="text-sm mb-1 opacity-70">
            {t.color}: {lang === "en" ? active?.color_name_en : active?.color_name_ar}
          </p>
          <ColorSwatches variants={variants} activeId={active?.id ?? ""} onPick={setActive} size={24} />
        </div>
        <div className="mb-3 text-sm opacity-80">
          <p>
            <b>{t.dims}:</b> {product.dimensions}
          </p>
          <p className="mt-1">
            <b>{t.care}:</b> {care}
          </p>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm opacity-70">{t.qty}</span>
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 border border-hairline rounded-full flex items-center justify-center">
            <Minus size={14} />
          </button>
          <span>{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="w-8 h-8 border border-hairline rounded-full flex items-center justify-center">
            <Plus size={14} />
          </button>
        </div>
        <button
          disabled={outOfStock}
          onClick={() => {
            if (!active) return;
            addProduct(product, active, lang, qty);
            onClose();
          }}
          className="w-full bg-charcoal text-cream rounded-lg py-2.5 hover:bg-wine transition-colors disabled:opacity-40"
        >
          {outOfStock ? t.outOfStockShort : t.add}
        </button>
      </div>
    </div>
  );
}
