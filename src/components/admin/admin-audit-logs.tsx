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

export default function AdminAuditLogs() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    fetch("/api/admin/audit-logs?limit=100", { cache: "no-store" })
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
          {items.map((item) => (
            <article key={item.id}>
              <span>{item.action || "-"}</span>
              <strong>{item.collectionName}/{item.documentId}</strong>
              <small>{item.adminEmail || item.adminUid || "admin"} · {item.createdAt || ""}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
