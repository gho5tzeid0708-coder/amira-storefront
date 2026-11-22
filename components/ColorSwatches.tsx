"use client";

import { Variant } from "@/lib/types";

export default function ColorSwatches({
  variants,
  activeId,
  onPick,
  size = 18
}: {
  variants: Variant[];
  activeId: string;
  onPick: (v: Variant) => void;
  size?: number;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {variants.map((v) => {
        const outOfStock = v.stock_quantity <= 0;
        return (
          <button
            key={v.id}
            type="button"
            disabled={outOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onPick(v);
            }}
            title={outOfStock ? `${v.color_name_en} — out of stock` : v.color_name_en}
            style={{ width: size, height: size, background: v.color_hex }}
            className={
              "rounded-full border relative " +
              (activeId === v.id ? "ring-2 ring-offset-1 ring-wine border-white" : "border-hairline") +
              (outOfStock ? " opacity-30 cursor-not-allowed after:absolute after:inset-0 after:rounded-full" : "")
            }
          />
        );
      })}
    </div>
  );
}
