"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useLanguage } from "@/components/language-provider";

type DashboardOverview = {
  counts: {
    activeDiscountCodes: number;
    customers: number;
    ordersInSample: number;
    products: number;
  };
  pendingOrders: number;
  revenueText: string;
};

type DashboardStatuses = {
  orderStatusCounts: Record<string, number>;
  paymentStatusCounts: Record<string, number>;
  productStatusCounts: Record<string, number>;
};

type LowStockProduct = {
  id: string;
  inventoryQuantity?: number;
  title?: string;
};

type RecentOrder = {
  id: string;
  orderCode?: string;
  paymentStatus?: string;
  status?: string;
  total?: number;
};

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  success: boolean;
};

type DashboardSection = "lowStock" | "overview" | "recentOrders" | "statuses";

type LoadingState = Record<DashboardSection, boolean>;

async function fetchDashboardSection<T>(section: DashboardSection) {
  const response = await fetch(`/api/admin/dashboard?section=${section}`, {
    cache: "no-store",
  });
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!payload.success) {
    throw new Error(payload.error?.message || "Không tải được bảng điều khiển.");
  }

  return payload.data as T;
}

function MetricCard({ label, value, tone = "default" }: { label: string; tone?: "default" | "green" | "red"; value: string | number }) {
  return (
    <article className={`tsq-admin-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function SectionLoading({ text }: { text: string }) {
  return <p className="tsq-admin-muted">{text}</p>;
}

function StatusList({ items }: { items: Record<string, number> }) {
  const entries = Object.entries(items);

  if (!entries.length) {
    return <p className="tsq-admin-muted">Chưa có dữ liệu.</p>;
  }

  return (
    <div className="tsq-admin-status-list">
      {entries.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<LoadingState>({
    lowStock: true,
    overview: true,
    recentOrders: true,
    statuses: true,
  });
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[] | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[] | null>(null);
  const [statuses, setStatuses] = useState<DashboardStatuses | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadSection<T>(section: DashboardSection, onSuccess: (data: T) => void) {
      try {
        const data = await fetchDashboardSection<T>(section);

        if (!ignore) {
          onSuccess(data);
        }
      } catch (error) {
        if (!ignore) {
          setMessages((currentMessages) => [...currentMessages, error instanceof Error ? error.message : "Không tải được bảng điều khiển."]);
        }
      } finally {
        if (!ignore) {
          setLoading((currentLoading) => ({
            ...currentLoading,
            [section]: false,
          }));
        }
      }
    }

    async function loadDashboard() {
      await loadSection<DashboardOverview>("overview", setOverview);
      await loadSection<RecentOrder[]>("recentOrders", setRecentOrders);
      await loadSection<LowStockProduct[]>("lowStock", setLowStockProducts);
      await loadSection<DashboardStatuses>("statuses", setStatuses);
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="tsq-admin-page">
      <div className="tsq-admin-page-header">
        <div>
          <span className="tsq-admin-eyebrow">{t("admin.dashboard.overview")}</span>
          <h1>{t("admin.dashboard.heading")}</h1>
          <p>{t("admin.dashboard.description")}</p>
        </div>
        <div className="tsq-admin-page-actions">
          <Link className="tsq-admin-primary-button" href="/admin/products">
            {t("admin.dashboard.createProduct")}
          </Link>
          <Link className="tsq-admin-secondary-button" href="/admin/orders">
            {t("admin.dashboard.viewOrders")}
          </Link>
        </div>
      </div>

      {messages.map((message) => (
        <div className="tsq-admin-alert error" key={message}>{message}</div>
      ))}

      <section className="tsq-admin-metrics-grid">
        <MetricCard label={t("admin.dashboard.products")} value={overview?.counts.products ?? "..."} />
        <MetricCard label={t("admin.dashboard.pendingOrders")} tone={(overview?.pendingOrders || 0) > 0 ? "red" : "default"} value={overview?.pendingOrders ?? "..."} />
        <MetricCard label={t("admin.dashboard.revenue")} tone="green" value={overview?.revenueText ?? "..."} />
        <MetricCard label={t("admin.dashboard.customers")} value={overview?.counts.customers ?? "..."} />
      </section>

      <section className="tsq-admin-dashboard-grid">
        <article className="tsq-admin-panel">
          <div className="tsq-admin-panel-header">
            <h2>{t("admin.dashboard.recentOrders")}</h2>
            <Link href="/admin/orders">{t("admin.dashboard.viewOrders")}</Link>
          </div>
          {loading.recentOrders ? (
            <SectionLoading text={t("admin.dashboard.loadingOrders")} />
          ) : (
              <div className="tsq-admin-compact-list">
                {(recentOrders || []).map((order) => (
                  <Link key={order.id} href="/admin/orders" className="tsq-admin-compact-row">
                    <span>
                      <strong>{order.orderCode || order.id}</strong>
                      <small>{order.status || "unknown"} / {order.paymentStatus || "unknown"}</small>
                    </span>
                    <b>{typeof order.total === "number" ? order.total.toLocaleString("vi-VN") : "-"}</b>
                  </Link>
                ))}
              </div>
          )}
        </article>

        <article className="tsq-admin-panel">
          <div className="tsq-admin-panel-header">
            <h2>{t("admin.dashboard.lowStock")}</h2>
            <Link href="/admin/products">{t("admin.quickManage")}</Link>
          </div>
          {loading.lowStock ? (
            <SectionLoading text={t("admin.dashboard.loadingLowStock")} />
          ) : (
              <div className="tsq-admin-compact-list">
                {(lowStockProducts || []).map((product) => (
                  <Link key={product.id} href="/admin/products" className="tsq-admin-compact-row">
                    <span>
                      <strong>{product.title || product.id}</strong>
                      <small>{product.id}</small>
                    </span>
                    <b>{product.inventoryQuantity ?? 0}</b>
                  </Link>
                ))}
              </div>
          )}
        </article>

        <article className="tsq-admin-panel">
          <h2>{t("admin.dashboard.productStatus")}</h2>
          {loading.statuses ? <SectionLoading text={t("admin.dashboard.loadingStatus")} /> : <StatusList items={statuses?.productStatusCounts || {}} />}
        </article>

        <article className="tsq-admin-panel">
          <h2>{t("admin.dashboard.orderStatus")}</h2>
          {loading.statuses ? <SectionLoading text={t("admin.dashboard.loadingStatus")} /> : <StatusList items={statuses?.orderStatusCounts || {}} />}
          <h2 className="tsq-admin-section-spacer">{t("admin.dashboard.paymentStatus")}</h2>
          {loading.statuses ? <SectionLoading text={t("admin.dashboard.loadingPayment")} /> : <StatusList items={statuses?.paymentStatusCounts || {}} />}
        </article>
      </section>
    </div>
  );
}
