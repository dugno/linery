"use client";

import { useEffect, useState } from "react";

import { hasAdminPermission, useAdminPermissions } from "@/components/admin/admin-permissions";
import { useLanguage } from "@/components/language-provider";

type MediaAsset = {
  contentType?: string;
  fileName?: string;
  id: string;
  originalName?: string;
  size?: number;
  url: string;
};

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  success: boolean;
};

const LIST_PAGE_SIZE_OPTIONS = [24, 48, 96];

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!payload.success) {
    throw new Error(payload.error?.message || "Yêu cầu không thành công.");
  }

  return payload.data as T;
}

export default function AdminMediaLibrary() {
  const { t } = useLanguage();
  const { permissions } = useAdminPermissions();
  const canDelete = hasAdminPermission(permissions, "media.delete");
  const canUpload = hasAdminPermission(permissions, "media.upload");
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(48);
  const totalPages = Math.max(1, Math.ceil(items.length / listPageSize));
  const currentListPage = Math.min(listPage, totalPages);
  const pagedItems = items.slice((currentListPage - 1) * listPageSize, currentListPage * listPageSize);

  async function load() {
    setIsBusy(true);
    setMessage("");

    try {
      setItems(await requestJson<MediaAsset[]>("/api/admin/media?limit=300"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tải được thư viện ảnh.");
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function upload(file?: File) {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    setIsBusy(true);
    setMessage("");

    try {
      const uploaded = await requestJson<MediaAsset>("/api/admin/media", {
        body: formData,
        method: "POST",
      });
      setItems((currentItems) => [uploaded, ...currentItems]);
      setMessage("Tải ảnh lên thành công.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tải ảnh lên không thành công.");
    } finally {
      setIsBusy(false);
    }
  }

  async function remove(item: MediaAsset) {
    if (!window.confirm(`Xoá ảnh ${item.originalName || item.fileName || item.id}?`)) {
      return;
    }

    setIsBusy(true);

    try {
      await requestJson(`/api/admin/media/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id));
      setMessage("Đã xoá ảnh.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không xoá được ảnh.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="tsq-admin-page">
      <div className="tsq-admin-page-header">
        <div>
          <span className="tsq-admin-eyebrow">Firebase Storage</span>
          <h1>{t("admin.media.title")}</h1>
          <p>{t("admin.media.description")}</p>
        </div>
        <div className="tsq-admin-page-actions">
          {canUpload ? (
            <label className="tsq-admin-primary-button">
              {t("admin.media.upload")}
              <input accept="image/*" hidden type="file" onChange={(event) => void upload(event.target.files?.[0])} />
            </label>
          ) : null}
          <button className="tsq-admin-secondary-button" disabled={isBusy} type="button" onClick={() => void load()}>
            {t("admin.media.reload")}
          </button>
        </div>
      </div>

      {message ? <div className={`tsq-admin-alert ${message.includes("thành công") || message.includes("Đã xoá") ? "success" : "error"}`}>{message}</div> : null}

      <section className="tsq-admin-media-grid">
        {pagedItems.map((item) => (
          <article className="tsq-admin-media-card" key={item.id}>
            <img src={item.url} alt={item.originalName || item.fileName || item.id} loading="lazy" />
            <div className="tsq-admin-media-actions">
              <button className="tsq-admin-secondary-button" type="button" onClick={() => void navigator.clipboard.writeText(item.url)}>
                {t("admin.media.copyUrl")}
              </button>
              {canDelete ? (
                <button className="tsq-admin-danger-button" disabled={isBusy} type="button" onClick={() => void remove(item)}>
                  {t("admin.delete")}
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </section>
      <div className="tsq-admin-filter-row">
        <select value={String(listPageSize)} onChange={(event) => {
          setListPageSize(Number(event.target.value));
          setListPage(1);
        }}>
          {LIST_PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size}/trang</option>
          ))}
        </select>
        <button className="tsq-admin-secondary-button" type="button" disabled={currentListPage <= 1 || isBusy} onClick={() => setListPage((current) => Math.max(1, current - 1))}>
          Trước
        </button>
        <span className="tsq-admin-muted">Trang {currentListPage}/{totalPages} · {items.length} ảnh</span>
        <button className="tsq-admin-secondary-button" type="button" disabled={currentListPage >= totalPages || isBusy} onClick={() => setListPage((current) => Math.min(totalPages, current + 1))}>
          Sau
        </button>
      </div>
    </div>
  );
}
