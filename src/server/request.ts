import type { ZodSchema } from "zod";

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  const body = await request.json().catch(() => null);

  return schema.parse(body);
}

export function getSearchParamNumber(params: URLSearchParams, name: string, defaultValue: number, maxValue: number) {
  const rawValue = params.get(name);
  const parsed = rawValue ? Number.parseInt(rawValue, 10) : defaultValue;

  if (!Number.isFinite(parsed) || parsed < 1) {
    return defaultValue;
  }

  return Math.min(parsed, maxValue);
}
