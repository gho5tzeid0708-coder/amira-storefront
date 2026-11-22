"use client";

import { useLanguage } from "./providers";

export default function Hero() {
  const { t } = useLanguage();
  return (
    <section className="max-w-6xl mx-auto px-4 pt-10 pb-6">
      <div
        className="rounded-2xl p-10 sm:p-16 text-center"
        style={{ background: "linear-gradient(135deg,#EFECE6,#FAF8F5 60%,#6E1E2A22)" }}
      >
        <h1 className="font-serif text-3xl sm:text-5xl mb-4">{t.heroTitle}</h1>
        <p className="max-w-md mx-auto opacity-75 mb-6">{t.heroSub}</p>
        <a
          href="#catalog"
          className="inline-block bg-charcoal text-cream rounded-full px-6 py-2.5 hover:bg-wine transition-colors"
        >
          {t.shop}
        </a>
      </div>
    </section>
  );
}
