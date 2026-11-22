import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers";

export const metadata: Metadata = {
  title: "AMIRA — أوشحة شتوية فاخرة",
  description: "أوشحة وشالات شتوية فاخرة، توصيل لجميع المدن الليبية مع الدفع نقداً عند الاستلام."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Arabic/RTL is the default language (see components/providers.tsx); this matches
  // that default for the first server-rendered paint so there's no flash of LTR/EN.
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans bg-cream text-charcoal min-h-[100dvh]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
