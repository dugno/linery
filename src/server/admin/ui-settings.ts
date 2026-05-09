import { normalizeLocale, type Locale } from "@/lib/i18n";
import { getFirebaseAdmin } from "@/server/firebase-admin";

type AdminUiDocument = {
  adminUi?: {
    locale?: unknown;
    showAdvancedJsonEditor?: unknown;
  };
};

export type AdminUiSettings = {
  locale: Locale;
  showAdvancedJsonEditor: boolean;
};

export async function getAdminUiSettings(): Promise<AdminUiSettings> {
  try {
    const snapshot = await getFirebaseAdmin().db.collection("siteSettings").doc("main").get();
    const data = snapshot.data() as AdminUiDocument | undefined;

    return {
      locale: normalizeLocale(typeof data?.adminUi?.locale === "string" ? data.adminUi.locale : undefined),
      showAdvancedJsonEditor: data?.adminUi?.showAdvancedJsonEditor !== false,
    };
  } catch {
    return {
      locale: "vi",
      showAdvancedJsonEditor: true,
    };
  }
}
