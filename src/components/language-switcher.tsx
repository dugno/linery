"use client";

import { useLanguage } from "@/components/language-provider";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className={`tsq-language-switcher ${className}`} aria-label={t("common.language")}>
      <button className={locale === "vi" ? "active" : ""} type="button" onClick={() => setLocale("vi")}>
        VI
      </button>
      <button className={locale === "en" ? "active" : ""} type="button" onClick={() => setLocale("en")}>
        EN
      </button>
    </div>
  );
}
