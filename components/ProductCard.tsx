"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { useLanguage, useCart } from "./providers";
import ColorSwatches from "./ColorSwatches";
import { CATEGORY_TAG } from "@/lib/constants";

export default function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const { lang, t } = useLanguage();
  const { addProduct } = useCart();
  const variants = product.product_variants;
  const [active, setActive] = useState(variants.find((v) => v.stock_quantity > 0) ?? variants[0]);
  const hex = active?.color_hex ?? "#6E1E2A";
  const outOfStock = !active || active.stock_quantity <= 0;
  const tag = CATEGORY_TAG[product.category];

  return (
    <div className="bg-stone rounded-xl overflow-hidden border border-hairline flex flex-col">
      <button
        onClick={() => onOpen(product)}
        className="h-56 w-full relative flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${hex}22, ${hex}55)` }}
      >
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name_en} className="h-full w-full object-cover" />
        ) : (
          <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke={hex} strokeWidth="1">
            <path
              d="M4 7c3 3 6-3 9 0s6-3 9 0M4 13c3 3 6-3 9 0s6-3 9 0M4 19c3 3 6-3 9 0s6-3 9 0"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-serif text-[15px] leading-snug">{lang === "en" ? product.name_en : product.name_ar}</h3>

        <div className="flex gap-1.5 flex-wrap">
          {product.dimensions && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream border border-hairline">{product.dimensions}</span>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream border border-hairline">
            {lang === "en" ? tag.en : tag.ar}
          </span>
        </div>

        <p className="text-wine font-medium">
          {product.price_lyd} د.ل <span className="text-xs opacity-60 font-normal">— {t.inStock(active?.stock_quantity ?? 0)}</span>
        </p>
        <ColorSwatches variants={variants} activeId={active?.id ?? ""} onPick={setActive} />
        <button
          disabled={outOfStock}
          onClick={() => active && addProduct(product, active, lang, 1)}
          className="mt-auto bg-charcoal text-cream rounded-lg py-2 text-sm hover:bg-wine transition-colors disabled:opacity-40 disabled:hover:bg-charcoal"
        >
          {outOfStock ? t.outOfStockShort : t.add}
        </button>
      </div>
    </div>
  );
}
