"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AdminPermissionProvider, hasAdminPermission } from "@/components/admin/admin-permissions";
import LanguageSwitcher from "@/components/language-switcher";
import { useLanguage } from "@/components/language-provider";
import type { TranslationKey } from "@/lib/i18n";

type AdminMe = {
  adminUi?: {
    showAdvancedJsonEditor?: boolean;
  };
  customer?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;
  permissions: string[];
  role: string;
  status: string;
  user: {
    email?: string;
    uid: string;
  };
};

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  success: boolean;
};

const navItems = [
  { href: "/admin", marker: "D", permission: "dashboard.read", titleKey: "admin.nav.dashboard" },
  { href: "/admin/products", marker: "P", permission: "products.read", titleKey: "admin.nav.products" },
  { href: "/admin/orders", marker: "O", permission: "orders.read", titleKey: "admin.nav.orders" },
  { href: "/admin/collections", marker: "C", permission: "collections.read", titleKey: "admin.nav.collections" },
  { href: "/admin/discounts", marker: "%", permission: "discounts.read", titleKey: "admin.nav.discounts" },
  { href: "/admin/shipping", marker: "S", permission: "shipping.read", titleKey: "admin.nav.shipping" },
  { href: "/admin/settings", marker: "St", permission: "settings.read", titleKey: "admin.nav.settings" },
  { href: "/admin/media", marker: "M", permission: "media.read", titleKey: "admin.nav.media" },
  { href: "/admin/pages", marker: "Pg", permission: "content.read", titleKey: "admin.nav.pages" },
  { href: "/admin/blogs", marker: "B", permission: "content.read", titleKey: "admin.nav.blogs" },
  { href: "/admin/articles", marker: "A", permission: "content.read", titleKey: "admin.nav.articles" },
  { href: "/admin/users", marker: "U", permission: "users.read", titleKey: "admin.nav.users" },
  { href: "/admin/audit", marker: "L", permission: "audit.read", titleKey: "admin.nav.audit" },
] as const satisfies Array<{ href: string; marker: string; permission: string; titleKey: TranslationKey }>;

async function fetchAdminMe() {
  const response = await fetch("/api/admin/me", {
    cache: "no-store",
  });
  const payload = (await response.json()) as ApiEnvelope<AdminMe>;

  if (!payload.success) {
    throw new Error(payload.error?.message || "Cần đăng nhập quản trị.");
  }

  return payload.data as AdminMe;
}

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "blocked">(isLoginPage ? "ready" : "checking");
  const displayName = useMemo(() => {
    const customerName = [admin?.customer?.firstName, admin?.customer?.lastName].filter(Boolean).join(" ");

    return customerName || admin?.customer?.email || admin?.user.email || "Admin";
  }, [admin]);

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    let ignore = false;

    fetchAdminMe()
      .then((me) => {
        if (!ignore) {
          setAdmin(me);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!ignore) {
          setStatus("blocked");
          router.replace("/admin/login");
        }
      });

    return () => {
      ignore = true;
    };
  }, [isLoginPage, router]);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    router.replace("/admin/login");
  }

  function closeDrawer() {
    setIsSidebarOpen(false);
  }

  if (isLoginPage) {
    return children;
  }

  if (status === "checking") {
    return (
      <div className="tsq-admin-loading">
        <div className="tsq-admin-loading-card">
          <span className="tsq-admin-spinner" />
          <strong>{t("admin.checkingPermissions")}</strong>
        </div>
      </div>
    );
  }

  if (status === "blocked") {
    return null;
  }

  return (
    <div className={`tsq-admin ${isSidebarCollapsed ? "sidebar-collapsed" : ""} ${isSidebarOpen ? "drawer-open" : ""}`}>
      <button className="tsq-admin-drawer-scrim" type="button" aria-label="Đóng menu quản trị" onClick={closeDrawer} />
      <aside className="tsq-admin-sidebar">
        <Link href="/admin" className="tsq-admin-brand">
          <span className="tsq-admin-brand-mark">Q</span>
          <span>
            <strong>Tiệm sách Quýt</strong>
            <small>{t("admin.brand.subtitle")}</small>
          </span>
        </Link>
        <nav className="tsq-admin-nav" aria-label="Điều hướng quản trị">
          {navItems.filter((item) => hasAdminPermission(admin?.permissions || [], item.permission)).map((item) => {
            const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href} className={`tsq-admin-link ${active ? "active" : ""}`} onClick={closeDrawer}>
                <span>{item.marker}</span>
                <b>{t(item.titleKey)}</b>
              </Link>
            );
          })}
        </nav>
        <div className="tsq-admin-sidebar-footer">
          <button className="tsq-admin-sidebar-logout" type="button" onClick={logout}>
            <span>Out</span>
            <b>{t("admin.logout")}</b>
          </button>
        </div>
      </aside>

      <div className="tsq-admin-workspace">
        <header className="tsq-admin-topbar">
          <div className="tsq-admin-topbar-left">
            <button className="tsq-admin-icon-button tsq-admin-drawer-button" type="button" aria-label="Mở menu quản trị" onClick={() => setIsSidebarOpen(true)}>
              ☰
            </button>
            <button className="tsq-admin-icon-button tsq-admin-collapse-button" type="button" aria-label={isSidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"} onClick={() => setIsSidebarCollapsed((current) => !current)}>
              {isSidebarCollapsed ? "›" : "‹"}
            </button>
            <div>
              <strong>AdminRBAC</strong>
              <small>{displayName}</small>
            </div>
          </div>
          <div className="tsq-admin-topbar-actions">
            <div id="tsq-admin-topbar-actions-slot" className="tsq-admin-topbar-page-actions" />
            <Link href="/" className="tsq-admin-ghost-button">
              {t("admin.nav.store")}
            </Link>
            <LanguageSwitcher />
          </div>
        </header>
        <AdminPermissionProvider permissions={admin?.permissions || []} role={admin?.role} showAdvancedJsonEditor={admin?.adminUi?.showAdvancedJsonEditor !== false}>
          <main className="tsq-admin-main">{children}</main>
        </AdminPermissionProvider>
      </div>
    </div>
  );
}
