"use client";

import { ShoppingBag, Search, Globe } from "lucide-react";
import { useLanguage, useCart, useFilter } from "./providers";
import { CATEGORIES } from "@/lib/constants";

export default function Navbar() {
  const { lang, t, toggleLang } = useLanguage();
  const { count, openCart } = useCart();
  const { category, setCategory, query, setQuery } = useFilter();

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-hairline">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <a href="#catalog" className="font-serif text-2xl tracking-wide shrink-0">
          AMIRA
        </a>

        <nav className="hidden md:flex gap-4 text-sm flex-1">
          {CATEGORIES.map((c) => (
            <a
              key={c.key}
              href="#catalog"
              onClick={() => setCategory(c.key)}
              className={"hover:text-wine " + (category === c.key ? "text-wine font-medium" : "")}
            >
              {lang === "en" ? c.en : c.ar}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 border border-hairline rounded-full px-3 py-1.5 bg-white flex-1 min-w-[140px] max-w-xs">
          <Search size={16} className="opacity-50 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            className="bg-transparent outline-none text-base w-full"
          />
        </div>

        <button
          onClick={toggleLang}
          className="flex items-center gap-1 text-sm border border-hairline rounded-full px-3 py-1.5 hover:bg-stone shrink-0"
        >
          <Globe size={16} />
          {lang === "en" ? "عربي" : "EN"}
        </button>

        <button onClick={openCart} className="relative shrink-0" aria-label="Open cart">
          <ShoppingBag />
          {count > 0 && (
            <span className="absolute -top-2 -end-2 bg-wine text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
