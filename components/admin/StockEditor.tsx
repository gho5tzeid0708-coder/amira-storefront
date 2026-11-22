"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStock } from "@/app/admin/actions";

export type AdminVariant = {
  id: string;
  product_id: string;
  color_name_en: string;
  color_hex: string;
  stock_quantity: number;
  products: { name_en: string } | null;
};

export default function StockEditor({ variants }: { variants: AdminVariant[] }) {
  const [values, setValues] = useState<Record<string, number>>(Object.fromEntries(variants.map((v) => [v.id, v.stock_quantity])));
  const [isPending, startTransition] = useTransition();
  const [savedId, setSavedId] = useState<string | null>(null);
  const router = useRouter();

  const save = (variantId: string) => {
    startTransition(async () => {
      await updateStock(variantId, values[variantId]);
      setSavedId(variantId);
      router.refresh();
      setTimeout(() => setSavedId(null), 1500);
    });
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      {variants.map((v) => (
        <div key={v.id} className="flex items-center gap-3 p-3 border-b border-hairline last:border-0 text-sm">
          <span className="w-4 h-4 rounded-full shrink-0" style={{ background: v.color_hex }} />
          <span className="flex-1">
            {v.products?.name_en ?? "—"} — {v.color_name_en}
          </span>
          <input
            type="number"
            min={0}
            value={values[v.id]}
            onChange={(e) => setValues({ ...values, [v.id]: Number(e.target.value) })}
            className="w-20 border border-hairline rounded-lg px-2 py-1"
          />
          <button
            onClick={() => save(v.id)}
            disabled={isPending}
            className="text-xs bg-charcoal text-cream rounded-full px-3 py-1.5 hover:bg-wine transition-colors"
          >
            {savedId === v.id ? "Saved" : "Update"}
          </button>
        </div>
      ))}
    </div>
  );
}
