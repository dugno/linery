"use client";

import { useEffect, useState } from "react";

type CssVersion = {
  css: string;
  savedAt: string;
};

export default function AdminCssEditor() {
  const [css, setCss] = useState("");
  const [savedCss, setSavedCss] = useState("");
  const [versions, setVersions] = useState<CssVersion[]>([]);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const hasChanges = css !== savedCss;

  useEffect(() => {
    fetch("/api/admin/custom-css")
      .then((response) => response.json())
      .then((payload: { data?: { css?: string; versions?: CssVersion[] }; success: boolean }) => {
        if (payload.success && payload.data) {
          setCss(payload.data.css || "");
          setSavedCss(payload.data.css || "");
          setVersions(payload.data.versions || []);
        }

        setIsLoaded(true);
      })
      .catch(() => {
        setMessage("Không tải được CSS.");
        setIsLoaded(true);
      });
  }, []);

  async function save() {
    setIsBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/custom-css", {
        body: JSON.stringify({ css }),
        headers: { "content-type": "application/json" },
        method: "PUT",
      });

      const payload = (await response.json()) as {
        data?: { css?: string; versions?: CssVersion[] };
        error?: { message: string };
        success: boolean;
      };

      if (!payload.success) {
        throw new Error(payload.error?.message || "Lưu không thành công.");
      }

      const saved = payload.data?.css || "";

      setSavedCss(saved);
      setCss(saved);
      setVersions(payload.data?.versions || []);
      setMessage("Lưu CSS thành công. Tải lại trang cửa hàng để xem thay đổi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Có lỗi xảy ra.");
    } finally {
      setIsBusy(false);
    }
  }

  function discard() {
    setCss(savedCss);
    setMessage("");
  }

  function restoreVersion(version: CssVersion) {
    setCss(version.css);
    setShowVersions(false);
    setMessage(`Đã tải phiên bản ${formatDate(version.savedAt)} vào trình chỉnh sửa. Nhấn "Lưu CSS" để áp dụng.`);
  }

  function formatDate(iso: string) {
    const date = new Date(iso);

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      second: "2-digit",
      year: "numeric",
    });
  }

  if (!isLoaded) {
    return (
      <div className="tsq-admin-panel">
        <div className="tsq-admin-empty">Đang tải CSS...</div>
      </div>
    );
  }

  return (
    <div className="tsq-admin-panel tsq-admin-section-spacer">
      <div className="tsq-admin-panel-header">
        <h2>Tuỳ chỉnh CSS</h2>
        <div className="tsq-admin-inline-actions">
          {versions.length > 0 ? (
            <button
              className="tsq-admin-secondary-button"
              type="button"
              onClick={() => setShowVersions(!showVersions)}
            >
              {showVersions ? "Ẩn lịch sử" : `Lịch sử (${versions.length})`}
            </button>
          ) : null}
          {hasChanges ? (
            <>
              <button className="tsq-admin-secondary-button" type="button" disabled={isBusy} onClick={discard}>
                Huỷ
              </button>
              <button className="tsq-admin-primary-button" type="button" disabled={isBusy} onClick={() => void save()}>
                Lưu CSS
              </button>
            </>
          ) : null}
        </div>
      </div>
      <p className="tsq-admin-muted" style={{ margin: "8px 0 12px", fontSize: 13 }}>
        CSS được áp dụng trực tiếp trên toàn bộ trang cửa hàng. Hệ thống tự động lưu tối đa 10 phiên bản trước đó.
      </p>
      {message ? <div className={`tsq-admin-alert ${message.includes("thành công") || message.includes("Đã tải") ? "success" : "error"}`}>{message}</div> : null}

      {showVersions ? (
        <div style={{
          marginBottom: 16,
          border: "1px solid #c9d1dc",
          borderRadius: 6,
          overflow: "hidden",
        }}>
          <div style={{
            padding: "8px 12px",
            background: "#f1f5f9",
            borderBottom: "1px solid #c9d1dc",
            fontWeight: 600,
            fontSize: 13,
          }}>
            Lịch sử phiên bản (mới nhất trước)
          </div>
          {versions.map((version, index) => (
            <div
              key={version.savedAt}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderBottom: index < versions.length - 1 ? "1px solid #e2e8f0" : "none",
                fontSize: 13,
              }}
            >
              <div>
                <strong>#{versions.length - index}</strong>
                <span style={{ marginLeft: 8, color: "#64748b" }}>{formatDate(version.savedAt)}</span>
                <span style={{ marginLeft: 8, color: "#94a3b8" }}>{version.css.length} ký tự</span>
              </div>
              <button
                className="tsq-admin-secondary-button"
                type="button"
                style={{ padding: "2px 10px", fontSize: 12 }}
                onClick={() => restoreVersion(version)}
              >
                Khôi phục
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <textarea
        value={css}
        onChange={(event) => setCss(event.target.value)}
        spellCheck={false}
        placeholder="/* Nhập CSS tuỳ chỉnh tại đây */"
        style={{
          width: "100%",
          minHeight: 420,
          padding: 12,
          border: "1px solid #c9d1dc",
          borderRadius: 6,
          background: "#0f172a",
          color: "#dbeafe",
          fontFamily: "\"SFMono-Regular\", Consolas, monospace",
          fontSize: 13,
          lineHeight: 1.5,
          resize: "vertical",
          tabSize: 2,
        }}
      />
      {hasChanges ? (
        <div className="tsq-admin-editor-actions" style={{ marginTop: 12 }}>
          <button className="tsq-admin-secondary-button" type="button" disabled={isBusy} onClick={discard}>
            Huỷ thay đổi
          </button>
          <button className="tsq-admin-primary-button" type="button" disabled={isBusy} onClick={() => void save()}>
            Lưu CSS
          </button>
        </div>
      ) : null}
    </div>
  );
}
