"use client";

import { useState } from "react";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { useLanguage, useCart } from "./providers";
import CheckoutForm from "./CheckoutForm";
import OrderConfirmation from "./OrderConfirmation";
import { PlaceOrderResult } from "@/app/actions";

type Step = "cart" | "form" | "done";

export default function CartDrawer() {
  const { lang, t } = useLanguage();
  const { lines, isOpen, closeCart, updateQty, removeLine, subtotal, clearCart } = useCart();

  const [step, setStep] = useState<Step>("cart");
  const [result, setResult] = useState<Extract<PlaceOrderResult, { ok: true }> | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (step === "done") {
      clearCart();
      setStep("cart");
      setResult(null);
    }
    closeCart();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="absolute top-0 end-0 h-[100dvh] w-full max-w-md bg-cream flex flex-col">
        <div className="flex items-center justify-between p-5 pb-3 shrink-0">
          <h2 className="font-serif text-xl">{step === "done" ? t.confirmed : t.cartTitle}</h2>
          <button onClick={handleClose} aria-label="Close cart">
            <X />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-5 pb-6"
          style={{ paddingBottom: step !== "cart" || lines.length === 0 ? "calc(1.5rem + env(safe-area-inset-bottom, 0px))" : undefined }}
        >
          {step === "cart" &&
            (lines.length === 0 ? (
              <div className="text-center py-20 opacity-70">
                <p className="mb-1">{t.empty}</p>
                <p className="text-sm">{t.keepBrowsing}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mb-5">
                {lines.map((l) => (
                  <div key={l.key} className="flex gap-3 items-start border-b border-hairline pb-3">
                    {l.kind === "product" ? (
                      <div className="w-14 h-14 rounded-lg shrink-0" style={{ background: `linear-gradient(135deg, ${l.colorHex}33, ${l.colorHex}66)` }} />
                    ) : (
                      <div className="w-14 h-14 rounded-lg shrink-0 grid grid-cols-2 overflow-hidden">
                        {l.items.slice(0, 4).map((it, idx) => (
                          <div key={idx} style={{ background: it.colorHex }} />
                        ))}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{lang === "en" ? l.name_en : l.name_ar}</p>
                      {l.kind === "product" ? (
                        <p className="text-xs opacity-60">{lang === "en" ? l.colorEn : l.colorAr}</p>
                      ) : (
                        <p className="text-xs opacity-60">{l.items.map((it) => (lang === "en" ? it.name_en : it.name_ar)).join(", ")}</p>
                      )}
                      <p className="text-wine text-sm">{l.unit_price} د.ل</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(l.key, -1)} className="w-6 h-6 border border-hairline rounded-full flex items-center justify-center">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm w-4 text-center">{l.qty}</span>
                      <button onClick={() => updateQty(l.key, 1)} className="w-6 h-6 border border-hairline rounded-full flex items-center justify-center">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => removeLine(l.key)} className="opacity-60 hover:opacity-100" aria-label={t.remove}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ))}

          {step === "form" && (
            <CheckoutForm
              lines={lines}
              subtotal={subtotal}
              onBack={() => setStep("cart")}
              onSuccess={(res) => {
                setResult(res);
                setStep("done");
              }}
            />
          )}

          {step === "done" && result && (
            <OrderConfirmation
              orderNumber={result.orderNumber}
              lines={lines}
              subtotal={result.subtotal}
              deliveryFee={result.deliveryFee}
              total={result.total}
              onContinue={handleClose}
            />
          )}
        </div>

        {step === "cart" && lines.length > 0 && (
          <div
            className="shrink-0 p-5 border-t border-hairline bg-cream"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="flex justify-between text-sm mb-3">
              <span>{t.subtotal}</span>
              <span>{subtotal} د.ل</span>
            </div>
            <button onClick={() => setStep("form")} className="w-full bg-charcoal text-cream rounded-lg py-2.5 hover:bg-wine transition-colors">
              {t.checkout}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
