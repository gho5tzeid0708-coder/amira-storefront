"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations, Lang, T } from "@/lib/translations";
import { CartLine, Product, Variant } from "@/lib/types";
import { BUNDLE_PRICE } from "@/lib/constants";

// ---------------- Language ----------------
type LangCtx = { lang: Lang; t: T; toggleLang: () => void };
const LanguageContext = createContext<LangCtx | null>(null);

function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Arabic is the default language for Libyan shoppers; a saved preference (if any) wins.
  const [lang, setLang] = useState<Lang>("ar");

  useEffect(() => {
    const saved = window.localStorage.getItem("amira_lang") as Lang | null;
    if (saved === "en" || saved === "ar") setLang(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = translations[lang].dir;
    window.localStorage.setItem("amira_lang", lang);
  }, [lang]);

  const value = useMemo<LangCtx>(
    () => ({ lang, t: translations[lang], toggleLang: () => setLang((l) => (l === "ar" ? "en" : "ar")) }),
    [lang]
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within AppProviders");
  return ctx;
}

// ---------------- Cart ----------------
type CartCtx = {
  lines: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addProduct: (p: Product, v: Variant, lang: Lang, qty: number) => void;
  addBundle: (items: { product: Product; variant: Variant }[], note: string) => void;
  updateQty: (key: string, delta: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  subtotal: number;
  count: number;
};
const CartContext = createContext<CartCtx | null>(null);

function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addProduct: CartCtx["addProduct"] = (p, v, lang, qty) => {
    const key = `product-${p.id}-${v.id}`;
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l));
      return [
        ...prev,
        {
          key,
          kind: "product",
          name_en: p.name_en,
          name_ar: p.name_ar,
          unit_price: p.price_lyd,
          qty,
          productId: p.id,
          variantId: v.id,
          colorEn: v.color_name_en,
          colorAr: v.color_name_ar,
          colorHex: v.color_hex
        }
      ];
    });
    setIsOpen(true);
  };

  const addBundle: CartCtx["addBundle"] = (items, note) => {
    const key = `bundle-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setLines((prev) => [
      ...prev,
      {
        key,
        kind: "bundle",
        name_en: "Gift Box",
        name_ar: "علبة هدايا",
        unit_price: BUNDLE_PRICE,
        qty: 1,
        note,
        items: items.map(({ product, variant }) => ({
          productId: product.id,
          variantId: variant.id,
          name_en: product.name_en,
          name_ar: product.name_ar,
          colorHex: variant.color_hex
        }))
      }
    ]);
    setIsOpen(true);
  };

  const updateQty: CartCtx["updateQty"] = (key, delta) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, qty: Math.max(1, l.qty + delta) } : l)));

  const removeLine: CartCtx["removeLine"] = (key) => setLines((prev) => prev.filter((l) => l.key !== key));

  const subtotal = lines.reduce((s, l) => s + l.unit_price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  const value: CartCtx = {
    lines,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addProduct,
    addBundle,
    updateQty,
    removeLine,
    clearCart: () => setLines([]),
    subtotal,
    count
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within AppProviders");
  return ctx;
}

// ---------------- Catalog filter/search ----------------
type FilterCtx = {
  category: "all" | "plush" | "reversible" | "giftbox";
  setCategory: (c: FilterCtx["category"]) => void;
  query: string;
  setQuery: (q: string) => void;
};
const FilterContext = createContext<FilterCtx | null>(null);

function FilterProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategory] = useState<FilterCtx["category"]>("all");
  const [query, setQuery] = useState("");
  return (
    <FilterContext.Provider value={{ category, setCategory, query, setQuery }}>{children}</FilterContext.Provider>
  );
}

export function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilter must be used within AppProviders");
  return ctx;
}

// ---------------- Combined ----------------
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <FilterProvider>
        <CartProvider>{children}</CartProvider>
      </FilterProvider>
    </LanguageProvider>
  );
}
