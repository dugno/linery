"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { hasAdminPermission, useAdminPermissions } from "@/components/admin/admin-permissions";
import { useLanguage } from "@/components/language-provider";
import { normalizeLocale, translateLiteral } from "@/lib/i18n";

type AdminShellProps = {
  createTemplate?: Record<string, unknown>;
  detailPath?: string;
  endpoint: string;
  idField: string;
  mode?: "list" | "singleton";
  title: string;
};

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    hasMore: boolean;
    limit: number;
    page: number;
    total?: number;
  };
  success: boolean;
};

type MediaAsset = {
  id: string;
  originalName?: string;
  url: string;
};

type CollectionOption = {
  id?: string;
  slug?: string;
  title?: string;
};

type SelectOption = {
  label: string;
  value: string;
};

type ResourcePermissions = {
  create: string;
  delete: string;
  update: string | string[];
};

const LIST_PAGE_SIZE_OPTIONS = [25, 50, 100];

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function parseJson(value: string) {
  return JSON.parse(value) as Record<string, unknown>;
}

function getValue(item: Record<string, unknown>, key: string) {
  const value = item[key];

  if (typeof value === "number") {
    return value.toLocaleString("vi-VN");
  }

  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

function getPathValue(source: Record<string, unknown> | null, path: string) {
  return path.split(".").reduce<unknown>((value, key) => (value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined), source);
}

function getItemTitle(item: Record<string, unknown>, idField: string) {
  return String(item.title || item.orderCode || item.code || item.label || item[idField] || item.id || "");
}

function getItemSubtitle(item: Record<string, unknown>, endpoint: string) {
  if (endpoint.includes("collections")) {
    return String(item.status || "");
  }

  return String(item.author || item.status || item.paymentStatus || item.href || item.type || "");
}

function getItemId(item: Record<string, unknown>, idField: string) {
  return String(item[idField] || item.id || "");
}

function getColumns(endpoint: string) {
  if (endpoint.includes("admin/home")) {
    return ["title", "sliderLink", "type", "slug"];
  }

  if (endpoint.includes("products")) {
    return ["title", "author", "price", "inventoryQuantity", "status"];
  }

  if (endpoint.includes("orders")) {
    return ["orderCode", "status", "paymentStatus", "total"];
  }

  if (endpoint.includes("discount")) {
    return ["code", "type", "value", "active"];
  }

  if (endpoint.includes("shipping")) {
    return ["id", "label", "fee", "active"];
  }

  return ["title", "slug", "href", "type"];
}

function getResourcePermissions(endpoint: string): ResourcePermissions {
  if (endpoint.includes("products")) {
    return { create: "products.create", delete: "products.archive", update: "products.update" };
  }

  if (endpoint.includes("collections")) {
    return { create: "collections.create", delete: "", update: "collections.update" };
  }

  if (endpoint.includes("orders")) {
    return { create: "", delete: "", update: ["orders.update_status", "orders.update_payment", "orders.add_internal_note"] };
  }

  if (endpoint.includes("discount")) {
    return { create: "discounts.create", delete: "discounts.delete", update: "discounts.update" };
  }

  if (endpoint.includes("shipping")) {
    return { create: "", delete: "", update: "shipping.update" };
  }

  if (endpoint.includes("site-settings")) {
    return { create: "", delete: "", update: "settings.update" };
  }

  if (endpoint.includes("users")) {
    return { create: "", delete: "", update: "users.manage_roles" };
  }

  if (endpoint.includes("audit")) {
    return { create: "", delete: "", update: "" };
  }

  return { create: "content.create", delete: "content.delete", update: "content.update" };
}

function setPathValue(source: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  const [key, ...rest] = path;

  if (!key) {
    return source;
  }

  if (rest.length === 0) {
    return {
      ...source,
      [key]: value,
    };
  }

  const nestedValue = source[key];

  return {
    ...source,
    [key]: setPathValue(nestedValue && typeof nestedValue === "object" && !Array.isArray(nestedValue) ? (nestedValue as Record<string, unknown>) : {}, rest, value),
  };
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const headers = init?.body instanceof FormData
    ? init?.headers
    : {
        "content-type": "application/json",
        ...init?.headers,
      };
  const response = await fetch(url, {
    ...init,
    headers,
  });
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!payload.success) {
    throw new Error(payload.error?.message || "Yêu cầu không thành công.");
  }

  return payload.data as T;
}

async function requestEnvelope<T>(url: string, init?: RequestInit) {
  const headers = init?.body instanceof FormData
    ? init?.headers
    : {
        "content-type": "application/json",
        ...init?.headers,
      };
  const response = await fetch(url, {
    ...init,
    headers,
  });
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!payload.success) {
    throw new Error(payload.error?.message || "Yêu cầu không thành công.");
  }

  return payload;
}

export default function AdminShell({ createTemplate, detailPath, endpoint, idField, mode = "list", title }: AdminShellProps) {
  const { locale, setLocale, t } = useLanguage();
  const { permissions, setShowAdvancedJsonEditor, showAdvancedJsonEditor = true } = useAdminPermissions();
  const localizedTitle = translateLiteral(locale, title);
  const canReadCollections = hasAdminPermission(permissions, "collections.read");
  const canReadMedia = hasAdminPermission(permissions, "media.read");
  const canUploadMedia = hasAdminPermission(permissions, "media.upload");
  const isProductResource = endpoint.includes("products");
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [collectionOptions, setCollectionOptions] = useState<CollectionOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [editorValue, setEditorValue] = useState(createTemplate ? stringify(createTemplate) : "");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaAsset[]>([]);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const columns = useMemo(() => getColumns(endpoint), [endpoint]);
  const resourcePermissions = useMemo(() => getResourcePermissions(endpoint), [endpoint]);
  const canCreate = Boolean(resourcePermissions.create && hasAdminPermission(permissions, resourcePermissions.create));
  const canDelete = Boolean(resourcePermissions.delete && hasAdminPermission(permissions, resourcePermissions.delete));
  const canUpdate = Array.isArray(resourcePermissions.update)
    ? resourcePermissions.update.some((permission) => hasAdminPermission(permissions, permission))
    : Boolean(resourcePermissions.update && hasAdminPermission(permissions, resourcePermissions.update));
  const hasListFilters = endpoint.includes("products") || endpoint.includes("orders");
  const selectedEndpoint = useMemo(() => {
    if (mode === "singleton") {
      return endpoint;
    }

    return selectedId ? `${endpoint}/${encodeURIComponent(selectedId)}` : endpoint;
  }, [endpoint, mode, selectedId]);
  const selectedItem = useMemo(() => items.find((item) => getItemId(item, idField) === selectedId) || null, [idField, items, selectedId]);
  const shouldShowEditor = mode === "singleton" || isCreateMode || Boolean(selectedId);
  const filteredItems = items;
  const totalPages = Math.max(1, Math.ceil(totalItems / listPageSize));
  const currentListPage = Math.min(listPage, totalPages);
  const pagedItems = filteredItems;
  const editorObject = useMemo(() => {
    try {
      return parseJson(editorValue);
    } catch {
      return null;
    }
  }, [editorValue]);
  const topbarActionsSlot = typeof document === "undefined" ? null : document.getElementById("tsq-admin-topbar-actions-slot");
  const canSaveCurrent = Boolean(editorValue && ((!selectedId && canCreate) || (Boolean(selectedId) && canUpdate) || mode === "singleton"));
  const isInitialFilterLoad = useRef(true);
  const createButtonLabel = isProductResource ? "Thêm sách" : t("admin.createNew");

  async function run(label: string, action: () => Promise<void>) {
    setIsBusy(true);
    setMessage("");

    try {
      await action();
      setMessage(`${label} thành công.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Có lỗi xảy ra.");
    } finally {
      setIsBusy(false);
    }
  }

  async function loadData() {
    setIsLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams();

      if (query.trim()) {
        params.set("q", query.trim());
      }

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      if (paymentStatusFilter) {
        params.set("paymentStatus", paymentStatusFilter);
      }

      if (mode === "list") {
        params.set("limit", String(listPageSize));
        params.set("page", String(currentListPage));
      }

      const payload = await requestEnvelope<Record<string, unknown> | Array<Record<string, unknown>>>(`${endpoint}${params.size ? `?${params.toString()}` : ""}`);
      const data = payload.data;

      if (Array.isArray(data)) {
        setItems(data);
        setTotalItems(payload.pagination?.total || data.length);
        setEditorValue(data[0] ? stringify(data[0]) : createTemplate ? stringify(createTemplate) : "");
        setSelectedId(data[0] ? getItemId(data[0], idField) : "");
      } else {
        setItems([]);
        setTotalItems(0);
        setSelectedId(String(data?.[idField] || data?.id || "main"));
        setEditorValue(stringify(data || createTemplate || {}));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentListPage, endpoint, listPageSize]);

  useEffect(() => {
    if (isInitialFilterLoad.current) {
      isInitialFilterLoad.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStatusFilter, query, statusFilter]);

  useEffect(() => {
    if (!isProductResource || !canReadCollections) {
      return;
    }

    let ignore = false;

    requestJson<CollectionOption[]>("/api/admin/collections?limit=200")
      .then((collections) => {
        if (!ignore) {
          setCollectionOptions(collections);
        }
      })
      .catch(() => {
        if (!ignore) {
          setCollectionOptions([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, [canReadCollections, isProductResource]);

  async function selectItem(item: Record<string, unknown>) {
    const id = getItemId(item, idField);

    setSelectedId(id);
    setIsCreateMode(false);
    setEditorValue(stringify(item));

    if (!id) {
      return;
    }

    try {
      const detail = await requestJson<Record<string, unknown>>(`${endpoint}/${encodeURIComponent(id)}`);
      setEditorValue(stringify(detail));
      setItems((currentItems) => currentItems.map((currentItem) => (getItemId(currentItem, idField) === id ? detail : currentItem)));
    } catch {
      setEditorValue(stringify(item));
    }
  }

  function startNew() {
    setSelectedId("");
    setIsCreateMode(true);
    setStatusFilter("");
    setEditorValue(stringify(createTemplate || {}));
    setMessage("");
  }

  function updateEditor(path: string, value: unknown) {
    if (!editorObject) {
      return;
    }

    setEditorValue(stringify(setPathValue(editorObject, path.split("."), value)));
  }

  function renderTextField(label: string, path: string, placeholder = "") {
    return (
      <label>
        {label}
        <input value={String(getPathValue(editorObject, path) || "")} onChange={(event) => updateEditor(path, event.target.value)} placeholder={placeholder} />
      </label>
    );
  }

  async function loadMediaItems() {
    if (!canReadMedia) {
      setMessage("Tài khoản chưa có quyền xem thư viện ảnh.");
      return;
    }

    if (mediaItems.length > 0) {
      return;
    }

    setMediaItems(await requestJson<MediaAsset[]>("/api/admin/media?limit=80"));
  }

  async function uploadMediaForField(path: string, file?: File) {
    if (!file) {
      return;
    }

    if (!canUploadMedia) {
      setMessage("Tài khoản chưa có quyền tải ảnh lên.");
      return;
    }

    setIsBusy(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.set("file", file);

      const uploaded = await requestJson<MediaAsset>("/api/admin/media", {
        body: formData,
        method: "POST",
      });

      updateEditor(path, uploaded.url);
      setMediaItems((currentItems) => [uploaded, ...currentItems.filter((item) => item.id !== uploaded.id)]);
      setMessage("Tải ảnh lên thành công. Nhấn lưu thay đổi để cập nhật tài liệu.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tải ảnh lên không thành công.");
    } finally {
      setIsBusy(false);
    }
  }

  function renderMediaPicker(path: string) {
    if (!endpoint.includes("products") && !endpoint.includes("settings") && !endpoint.includes("articles") && !endpoint.includes("blogs")) {
      return null;
    }

    const currentUrl = String(getPathValue(editorObject, path) || "");

    return (
      <div className="tsq-admin-media-picker">
        <div className="tsq-admin-panel-header">
          <h4>Chọn ảnh</h4>
          <div className="tsq-admin-inline-actions">
            {canUploadMedia ? (
              <label className="tsq-admin-secondary-button">
                Tải ảnh từ máy tính
                <input accept="image/*" hidden type="file" onChange={(event) => void uploadMediaForField(path, event.target.files?.[0])} />
              </label>
            ) : null}
            {canReadMedia ? (
              <button className="tsq-admin-secondary-button" type="button" onClick={() => void loadMediaItems()}>
                Tải thư viện ảnh
              </button>
            ) : null}
          </div>
        </div>
        {currentUrl ? (
          <div className="tsq-admin-image-preview">
            <img src={currentUrl} alt="Ảnh hiện tại" loading="lazy" />
            <div>
              <strong>Ảnh hiện tại</strong>
              <small>{currentUrl}</small>
            </div>
          </div>
        ) : (
          <p className="tsq-admin-muted">Chưa chọn ảnh cho tài liệu này.</p>
        )}
        {mediaItems.length ? (
          <div className="tsq-admin-mini-media-grid">
            {mediaItems.map((item) => (
              <button key={item.id} type="button" onClick={() => updateEditor(path, item.url)}>
                <img src={item.url} alt={item.originalName || item.id} loading="lazy" />
              </button>
            ))}
          </div>
        ) : (
          <p className="tsq-admin-muted">Tải thư viện ảnh để chọn ảnh từ Firebase Storage.</p>
        )}
      </div>
    );
  }

  function renderNumberField(label: string, path: string) {
    return (
      <label>
        {label}
        <input type="number" value={Number(getPathValue(editorObject, path) || 0)} onChange={(event) => updateEditor(path, Number(event.target.value))} />
      </label>
    );
  }

  function renderTextareaField(label: string, path: string) {
    return (
      <label className="tsq-admin-wide-field">
        {label}
        <textarea value={String(getPathValue(editorObject, path) || "")} onChange={(event) => updateEditor(path, event.target.value)} />
      </label>
    );
  }

  function renderSelectField(label: string, path: string, options: Array<string | SelectOption>, defaultValue = "") {
    const normalizedOptions = options.map((option) => (typeof option === "string" ? { label: option, value: option } : option));
    const rawValue = getPathValue(editorObject, path);
    const fallbackValue = defaultValue || normalizedOptions[0]?.value || "";
    const currentValue = typeof rawValue === "string" ? rawValue : fallbackValue;
    const value = normalizedOptions.some((option) => option.value === currentValue) ? currentValue : fallbackValue;

    return (
      <label>
        {label}
        <select value={value} onChange={(event) => updateEditor(path, event.target.value)}>
          {normalizedOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  function renderBooleanField(label: string, path: string, defaultValue = false) {
    const pathValue = getPathValue(editorObject, path);
    const value = typeof pathValue === "boolean" ? pathValue : defaultValue;

    return (
      <label className="tsq-admin-checkbox-field">
        <input type="checkbox" checked={value} onChange={(event) => updateEditor(path, event.target.checked)} />
        {label}
      </label>
    );
  }

  function renderArrayField(label: string, path: string) {
    const value = getPathValue(editorObject, path);

    return (
      <label>
        {label}
        <input value={Array.isArray(value) ? value.join(", ") : ""} onChange={(event) => updateEditor(path, event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} />
      </label>
    );
  }

  function renderCollectionDropdown() {
    const selectedSlugs = getPathValue(editorObject, "collectionSlugs");
    const selected = Array.isArray(selectedSlugs) ? selectedSlugs.filter((item): item is string => typeof item === "string") : [];

    if (!canReadCollections) {
      return renderArrayField("Danh mục", "collectionSlugs");
    }

    function toggleCollection(slug: string) {
      updateEditor("collectionSlugs", selected.includes(slug) ? selected.filter((item) => item !== slug) : [...selected, slug]);
    }

    return (
      <div className="tsq-admin-dropdown-field">
        <span>Danh mục</span>
        <details>
          <summary>{selected.length ? `${selected.length} danh mục đã chọn` : "Chọn danh mục"}</summary>
          <div className="tsq-admin-dropdown-menu">
            {collectionOptions.length ? (
              collectionOptions.map((collection) => {
                const slug = String(collection.slug || collection.id || "");

                if (!slug) {
                  return null;
                }

                return (
                  <label key={slug}>
                    <input type="checkbox" checked={selected.includes(slug)} onChange={() => toggleCollection(slug)} />
                    <span>{collection.title || slug}</span>
                    <small>{slug}</small>
                  </label>
                );
              })
            ) : (
              <p className="tsq-admin-muted">Chưa tải được danh sách danh mục từ Firestore.</p>
            )}
          </div>
        </details>
      </div>
    );
  }

  function renderQuickEditor() {
    if (!editorObject) {
      return <div className="tsq-admin-alert error">JSON hiện tại không hợp lệ, vui lòng sửa trong trình chỉnh sửa.</div>;
    }

    if (endpoint.includes("products")) {
      return (
        <div className="tsq-admin-quick-form">
          {renderTextField("Tiêu đề", "title")}
          {renderTextField("Slug", "slug")}
          {renderTextField("Tác giả", "author")}
          {renderSelectField("Trạng thái", "status", ["active", "draft", "archived"])}
          {renderNumberField("Giá bán", "price")}
          {renderNumberField("Giá so sánh", "comparePrice")}
          {renderNumberField("Tồn kho", "inventoryQuantity")}
          {renderMediaPicker("image.src")}
          {renderCollectionDropdown()}
          {renderTextField("Tiêu đề SEO", "seo.title")}
          {renderTextareaField("Mô tả sản phẩm", "descriptionHtml")}
        </div>
      );
    }

    if (endpoint.includes("orders")) {
      return (
        <div className="tsq-admin-quick-form">
          {renderSelectField("Trạng thái đơn hàng", "status", ["pending_payment", "confirmed", "shipping", "completed", "cancelled"])}
          {renderSelectField("Trạng thái thanh toán", "paymentStatus", ["unpaid", "paid", "cod_pending", "refunded"])}
          {renderTextField("Mã vận đơn", "trackingCode")}
          {renderTextField("Ghi chú nội bộ", "internalNote")}
        </div>
      );
    }

    if (endpoint.includes("discount")) {
      return (
        <div className="tsq-admin-quick-form">
          {renderTextField("Mã", "code")}
          {renderSelectField("Loại", "type", ["percent", "fixed"])}
          {renderNumberField("Giá trị", "value")}
          {renderNumberField("Tạm tính tối thiểu", "minSubtotal")}
          {renderBooleanField("Đang hoạt động", "active")}
        </div>
      );
    }

    if (endpoint.includes("shipping")) {
      return (
        <div className="tsq-admin-quick-form">
          {renderTextField("Nhãn", "label")}
          {renderNumberField("Phí", "fee")}
          {renderBooleanField("Đang hoạt động", "active")}
        </div>
      );
    }

    if (endpoint.includes("users")) {
      return (
        <div className="tsq-admin-quick-form">
          {renderTextField("Email", "email")}
          {renderSelectField("Vai trò", "role", ["customer", "support", "order_manager", "catalog_manager", "content_editor", "marketing_manager", "admin", "owner"])}
          {renderSelectField("Trạng thái", "status", ["active", "disabled"])}
          {renderArrayField("Quyền cộng thêm", "extraPermissions")}
          {renderArrayField("Quyền thu hồi", "revokedPermissions")}
        </div>
      );
    }

  if (endpoint.includes("collections") || endpoint.includes("pages") || endpoint.includes("blogs") || endpoint.includes("articles")) {
      return (
        <div className="tsq-admin-quick-form">
          {renderTextField("Tiêu đề", "title")}
          {renderTextField("Slug", "slug")}
          {renderTextField("Href", "href")}
          {renderTextField("Tiêu đề SEO", "seo.title")}
          {renderTextField("Mô tả SEO", "seo.description")}
          {renderTextareaField("Nội dung/mô tả HTML", endpoint.includes("collections") ? "descriptionHtml" : "contentHtml")}
        </div>
      );
    }

    return (
      <div className="tsq-admin-quick-form">
        {renderTextField("Tên thương hiệu", "siteName")}
        {renderTextField("Nội dung banner đầu trang", "topBanner.text")}
        {renderTextField("Đường dẫn banner đầu trang", "topBanner.href")}
        {renderTextField("URL logo", "logo.src")}
        {renderMediaPicker("logo.src")}
        {renderTextField("Email liên hệ", "contact.email")}
        {renderTextField("Số điện thoại liên hệ", "contact.phone")}
        {renderSelectField("Ngôn ngữ giao diện admin", "adminUi.locale", [
          { label: "Tiếng Việt", value: "vi" },
          { label: "English", value: "en" },
        ], "vi")}
        {renderBooleanField("Hiện trình chỉnh sửa JSON nâng cao", "adminUi.showAdvancedJsonEditor", true)}
      </div>
    );
  }

  if (endpoint.includes("admin/home")) {
    return (
      <div className="tsq-admin-quick-form">
        {renderTextField("Tiêu đề trang", "title")}
        {renderTextField("Đường dẫn khi bấm banner", "sliderLink", "/collections/all")}
        {renderTextField("Ảnh banner (URL)", "sliderImage.src")}
        {renderTextField("Alt ảnh banner", "sliderImage.alt")}
        <div className="tsq-admin-inline-actions tsq-admin-home-save-actions">
          <button
            className="tsq-admin-primary-button"
            type="button"
            disabled={isBusy || !canSaveCurrent}
            onClick={() => run(t("admin.save"), saveCurrent)}
          >
            {t("admin.save")}
          </button>
        </div>
        {renderMediaPicker("sliderImage.src")}
      </div>
    );
  }

  async function saveCurrent() {
    const parsed = parseJson(editorValue);
    const method = selectedId || mode === "singleton" ? "PATCH" : "POST";
    const url = selectedId || mode === "singleton" ? selectedEndpoint : endpoint;
    const saved = await requestJson<Record<string, unknown>>(url, {
      body: JSON.stringify(parsed),
      method,
    });
    const savedId = String(saved?.[idField] || saved?.id || selectedId);

    setSelectedId(savedId);
    setIsCreateMode(false);
    setStatusFilter("");
    setEditorValue(stringify(saved));

    if (endpoint.includes("site-settings")) {
      const savedAdminUi = saved.adminUi;

      if (savedAdminUi && typeof savedAdminUi === "object") {
        if ("locale" in savedAdminUi && typeof savedAdminUi.locale === "string") {
          setLocale(normalizeLocale(savedAdminUi.locale));
        }

        if ("showAdvancedJsonEditor" in savedAdminUi && typeof savedAdminUi.showAdvancedJsonEditor === "boolean") {
          setShowAdvancedJsonEditor?.(savedAdminUi.showAdvancedJsonEditor);
        }
      }
    }

    if (mode === "list") {
      setItems((currentItems) => {
        const exists = currentItems.some((item) => getItemId(item, idField) === savedId);

        if (exists) {
          return currentItems.map((item) => (getItemId(item, idField) === savedId ? saved : item));
        }

        return [saved, ...currentItems];
      });
    }
  }

  async function deleteCurrent() {
    if (!window.confirm("Xác nhận xoá hoặc lưu trữ tài liệu này?")) {
      return;
    }

    const deleted = await requestJson<Record<string, unknown>>(selectedEndpoint, { method: "DELETE" });

    setEditorValue(stringify(deleted));
    setItems((currentItems) => {
      const currentIndex = currentItems.findIndex((item) => getItemId(item, idField) === selectedId);
      const nextItems = currentItems.filter((item) => getItemId(item, idField) !== selectedId);
      const fallbackItem = nextItems[currentIndex] || nextItems[currentIndex - 1] || null;

      setSelectedId(fallbackItem ? getItemId(fallbackItem, idField) : "");
      setIsCreateMode(false);
      setEditorValue(fallbackItem ? stringify(fallbackItem) : stringify(deleted));

      return nextItems;
    });
  }

  function renderOrderItems() {
    const items = editorObject?.items;

    if (!endpoint.includes("orders") || !Array.isArray(items)) {
      return null;
    }

    return (
      <div className="tsq-admin-order-items">
        <h3 className="tsq-admin-subheading">Sản phẩm trong đơn hàng</h3>
        {items.map((item, index) => {
          const orderItem = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

          return (
            <div key={String(orderItem.id || index)}>
              <span>
                <strong>{String(orderItem.title || orderItem.productSlug || "Sản phẩm")}</strong>
                <small>{String(orderItem.productSlug || "")}</small>
              </span>
              <b>{String(orderItem.quantity || 0)} x {typeof orderItem.price === "number" ? orderItem.price.toLocaleString("vi-VN") : "-"}</b>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="tsq-admin-page">
      {topbarActionsSlot
        ? createPortal(
            <>
              <button className="tsq-admin-secondary-button" type="button" disabled={isBusy || isLoading} onClick={() => void loadData()}>
                {t("admin.reload")}
              </button>
              {createTemplate && canCreate ? (
                <button className="tsq-admin-primary-button" type="button" disabled={isBusy} onClick={startNew}>
                  {createButtonLabel}
                </button>
              ) : null}
              {isCreateMode ? (
                <button
                  className="tsq-admin-secondary-button"
                  type="button"
                  disabled={isBusy || isLoading}
                  onClick={() => {
                    setIsCreateMode(false);
                    void loadData();
                  }}
                >
                  Quay lại danh sách
                </button>
              ) : null}
            </>,
            topbarActionsSlot,
          )
        : null}
      <div className="tsq-admin-page-header">
        <div>
          <span className="tsq-admin-eyebrow">{t("admin.resource.eyebrow")}</span>
          <h1>{localizedTitle}</h1>
          <p>{mode === "singleton" ? t("admin.resource.singletonDescription") : t("admin.resource.description")}</p>
        </div>
      </div>

      {message ? <div className={`tsq-admin-alert ${message.includes("thành công") ? "success" : "error"}`}>{message}</div> : null}

      <div className={mode === "singleton" || (mode === "list" && isCreateMode) ? "tsq-admin-single-grid" : "tsq-admin-resource-grid"}>
        {mode === "list" && !isCreateMode ? (
          <section className="tsq-admin-panel tsq-admin-list-panel">
            <div className="tsq-admin-panel-header">
              <h2>{t("admin.resource.documents")}</h2>
              <span>{items.length}/{totalItems}</span>
            </div>
            <input className="tsq-admin-search" placeholder={t("admin.resource.searchPlaceholder")} value={query} onChange={(event) => {
              setQuery(event.target.value);
              setListPage(1);
            }} />
            {hasListFilters ? (
              <div className="tsq-admin-filter-row">
                <select value={statusFilter} onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setListPage(1);
                }}>
                  <option value="">{t("admin.resource.allStatus")}</option>
                  {(endpoint.includes("products") ? ["active", "draft", "archived"] : ["pending_payment", "confirmed", "shipping", "completed", "cancelled"]).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {endpoint.includes("orders") ? (
                  <select value={paymentStatusFilter} onChange={(event) => {
                    setPaymentStatusFilter(event.target.value);
                    setListPage(1);
                  }}>
                    <option value="">{t("admin.resource.allPayment")}</option>
                    {["unpaid", "paid", "cod_pending", "refunded"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                ) : null}
              </div>
            ) : null}
            <div className="tsq-admin-table">
              {isLoading ? <div className="tsq-admin-empty">{t("admin.loadingData")}</div> : null}
              {!isLoading && pagedItems.length === 0 ? <div className="tsq-admin-empty">{t("admin.empty")}</div> : null}
              {pagedItems.map((item) => {
                const id = getItemId(item, idField);
                const subtitle = getItemSubtitle(item, endpoint);

                return (
                  <button key={id} className={id === selectedId ? "active" : ""} type="button" onClick={() => void selectItem(item)}>
                    <span>
                      <strong>{getItemTitle(item, idField)}</strong>
                      {subtitle ? <small>{subtitle}</small> : null}
                    </span>
                  </button>
                );
              })}
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
              <span className="tsq-admin-muted">Trang {currentListPage}/{totalPages}</span>
              <button className="tsq-admin-secondary-button" type="button" disabled={currentListPage >= totalPages} onClick={() => setListPage((current) => Math.min(totalPages, current + 1))}>
                Sau
              </button>
            </div>
          </section>
        ) : null}

        {shouldShowEditor ? (
          <section className="tsq-admin-panel tsq-admin-detail-panel">
            <div className="tsq-admin-panel-header">
              <h2>{selectedId || mode === "singleton" ? t("admin.detail") : t("admin.newDocument")}</h2>
              {detailPath ? <Link href={detailPath}>Mở trên cửa hàng</Link> : null}
            </div>
            {mode === "singleton" ? (
              <div className="tsq-admin-editor-actions">
                <button
                  className="tsq-admin-primary-button"
                  type="button"
                  disabled={isBusy || !canSaveCurrent}
                  onClick={() => run(t("admin.save"), saveCurrent)}
                >
                  {t("admin.save")}
                </button>
              </div>
            ) : null}

            {selectedItem ? (
              <div className="tsq-admin-detail-summary">
                {columns.map((column) => (
                  <div key={column}>
                    <span>{column}</span>
                    <strong>{getValue(selectedItem, column) || "-"}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            <h3 className="tsq-admin-subheading">Chỉnh nhanh</h3>
            {renderQuickEditor()}
            {renderOrderItems()}

            {showAdvancedJsonEditor ? (
              <>
                <label className="tsq-admin-editor-label" htmlFor={`${title}-json-editor`}>
                  Trình chỉnh sửa JSON nâng cao
                </label>
                <textarea id={`${title}-json-editor`} value={editorValue} onChange={(event) => setEditorValue(event.target.value)} spellCheck={false} />
              </>
            ) : null}
            {mode === "singleton" ? null : <div className="tsq-admin-inline-actions">
              <button
                className="tsq-admin-primary-button"
                type="button"
                disabled={isBusy || !canSaveCurrent}
                onClick={() => run(selectedId ? t("admin.save") : (isProductResource ? "Thêm sách" : t("admin.createNew")), saveCurrent)}
              >
                {selectedId ? t("admin.save") : (isProductResource ? "Lưu sách" : t("admin.createNew"))}
              </button>
              {mode === "list" && selectedId && canDelete ? (
                <button className="tsq-admin-danger-button" type="button" disabled={isBusy} onClick={() => run(t("admin.deleteArchive"), deleteCurrent)}>
                  {t("admin.deleteArchive")}
                </button>
              ) : null}
              {isCreateMode ? (
                <button
                  className="tsq-admin-secondary-button"
                  type="button"
                  disabled={isBusy || isLoading}
                  onClick={() => {
                    setIsCreateMode(false);
                    void loadData();
                  }}
                >
                  Quay lại danh sách
                </button>
              ) : null}
            </div>}
          </section>
        ) : (
          <section className="tsq-admin-panel tsq-admin-detail-panel">
            <div className="tsq-admin-empty">Chọn sách trong danh sách hoặc bấm `Thêm sách`.</div>
          </section>
        )}
      </div>
    </div>
  );
}
