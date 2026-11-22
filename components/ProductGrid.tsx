"use client";

import { useMemo, useState } from "react";
import { Product } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { useLanguage, useFilter } from "./providers";
import ProductCard from "./ProductCard";
import QuickViewModal from "./QuickViewModal";

export default function ProductGrid({ products }: { products: Product[] }) {
  const { lang } = useLanguage();
  const { category, setCategory, query } = useFilter();
  const [quickView, setQuickView] = useState<Product | null>(null);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const matchesCat = category === "all" || p.category === category;
        const name = lang === "en" ? p.name_en : p.name_ar;
        const matchesQuery = name.toLowerCase().includes(query.toLowerCase());
        return matchesCat && matchesQuery;
      }),
    [products, category, query, lang]
  );

  return (
    <section id="catalog" className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex gap-2 overflow-x-auto pb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={
              "shrink-0 text-sm px-4 py-1.5 rounded-full border " +
              (category === c.key ? "bg-charcoal text-cream border-charcoal" : "border-hairline hover:border-wine")
            }
          >
            {lang === "en" ? c.en : c.ar}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} onOpen={setQuickView} />
        ))}
      </div>

      {quickView && <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />}
    </section>
  );
}
