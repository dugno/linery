"use client";

import { useEffect, useState } from "react";

type AuditLog = {
  action?: string;
  adminEmail?: string;
  adminUid?: string;
  collectionName?: string;
  createdAt?: string;
  documentId?: string;
  id: string;
};

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  success: boolean;
};

const LIST_PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function AdminAuditLogs() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [message, setMessage] = useState("");
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(50);
  const totalPages = Math.max(1, Math.ceil(items.length / listPageSize));
  const currentListPage = Math.min(listPage, totalPages);
  const pagedItems = items.slice((currentListPage - 1) * listPageSize, currentListPage * listPageSize);

  useEffect(() => {
    let ignore = false;

    fetch("/api/admin/audit-logs?limit=200", { cache: "no-store" })
      .then((response) => response.json() as Promise<ApiEnvelope<AuditLog[]>>)
      .then((payload) => {
        if (!ignore) {
          setItems(payload.success ? payload.data || [] : []);
          setMessage(payload.success ? "" : payload.error?.message || "Không tải được nhật ký thao tác.");
        }
      })
      .catch((error) => {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : "Không tải được nhật ký thao tác.");
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="tsq-admin-page">
      <div className="tsq-admin-page-header">
        <div>
          <span className="tsq-admin-eyebrow">An toàn hệ thống</span>
          <h1>Nhật ký thao tác</h1>
          <p>Theo dõi các thay đổi quan trọng trong trang quản trị.</p>
        </div>
      </div>
      {message ? <div className="tsq-admin-alert error">{message}</div> : null}
      <section className="tsq-admin-panel">
        <div className="tsq-admin-audit-table">
          {pagedItems.map((item) => (
            <article key={item.id}>
              <span>{item.action || "-"}</span>
              <strong>{item.collectionName}/{item.documentId}</strong>
              <small>{item.adminEmail || item.adminUid || "admin"} · {item.createdAt || ""}</small>
            </article>
          ))}
        </div>
        <div className="tsq-admin-filter-row">
          <select value={String(listPageSize)} onChange={(event) => {
            setListPageSize(Number(event.target.value));
            setListPage(1);
          }}>
            {LIST_PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}/trang</option>
            ))}
          </select>
          <button className="tsq-admin-secondary-button" type="button" disabled={currentListPage <= 1} onClick={() => setListPage((current) => Math.max(1, current - 1))}>
            Trước
          </button>
          <span className="tsq-admin-muted">Trang {currentListPage}/{totalPages} · {items.length} dòng</span>
          <button className="tsq-admin-secondary-button" type="button" disabled={currentListPage >= totalPages} onClick={() => setListPage((current) => Math.min(totalPages, current + 1))}>
            Sau
          </button>
        </div>
      </section>
    </div>
  );
}
