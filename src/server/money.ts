export function parseVndPrice(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value !== "string") {
    return 0;
  }

  const numeric = value.replace(/[^\d]/g, "");

  if (!numeric) {
    return 0;
  }

  return Number.parseInt(numeric, 10);
}

export function formatVndPrice(value: number) {
  const normalizedValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;

  return `${normalizedValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}₫`;
}
