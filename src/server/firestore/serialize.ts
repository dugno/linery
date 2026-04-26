function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return Boolean(value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function");
}

export function serializeFirestoreValue<T>(value: T): T {
  if (isTimestampLike(value)) {
    return value.toDate().toISOString() as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeFirestoreValue(nestedValue)]),
    ) as T;
  }

  return value;
}
