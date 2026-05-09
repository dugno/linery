import "../globals.css";

import AdminLayoutShell from "@/components/admin/admin-layout-shell";
import { LanguageProvider } from "@/components/language-provider";
import { getAdminUiSettings } from "@/server/admin/ui-settings";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUi = await getAdminUiSettings();

  return (
    <LanguageProvider initialLocale={adminUi.locale} cookieName={null}>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </LanguageProvider>
  );
}
