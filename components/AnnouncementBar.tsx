"use client";

import { useLanguage } from "./providers";

export default function AnnouncementBar() {
  const { t } = useLanguage();
  return <div className="bg-charcoal text-cream text-center text-xs sm:text-sm py-2 px-3">{t.announce}</div>;
}
