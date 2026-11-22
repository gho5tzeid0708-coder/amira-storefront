"use client";

import { Check } from "lucide-react";
import { CartLine } from "@/lib/types";
import { useLanguage } from "./providers";

export default function OrderConfirmation({
  orderNumber,
  lines,
  subtotal,
  deliveryFee,
  total,
  onContinue
}: {
  orderNumber: string;
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  onContinue: () => void;
}) {
  const { lang, t } = useLanguage();
  return (
    <div className="text-center py-10">
      <div className="w-14 h-14 rounded-full bg-wine text-white flex items-center justify-center mx-auto mb-4">
        <Check />
      </div>
      <p className="mb-1 opacity-80">{t.orderNo}</p>
      <p className="font-serif text-2xl mb-4">{orderNumber}</p>
      <p className="text-sm opacity-70 mb-6">{t.thanks}</p>

      <div className="text-start bg-stone rounded-xl p-4 mb-6 text-sm flex flex-col gap-1">
        {lines.map((l) => (
          <div key={l.key} className="flex justify-between">
            <span>
              {(lang === "en" ? l.name_en : l.name_ar)} × {l.qty}
            </span>
            <span>{l.unit_price * l.qty} د.ل</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-hairline mt-2 pt-2">
          <span>{t.subtotal}</span>
          <span>{subtotal} د.ل</span>
        </div>
        <div className="flex justify-between">
          <span>{t.delivery}</span>
          <span>{deliveryFee} د.ل</span>
        </div>
        <div className="flex justify-between font-medium text-base border-t border-hairline mt-1 pt-1">
          <span>{t.total}</span>
          <span>{total} د.ل</span>
        </div>
      </div>

      <button onClick={onContinue} className="w-full bg-charcoal text-cream rounded-lg py-2.5 hover:bg-wine transition-colors">
        {t.continueShopping}
      </button>
    </div>
  );
}
