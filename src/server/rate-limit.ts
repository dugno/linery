import { ApiErrorResponse } from "@/server/api-response";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function enforceRateLimit(request: Request, key: string, limit: number, windowMs: number) {
  const bucketKey = `${key}:${getClientIp(request)}`;
  const now = Date.now();
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + windowMs,
    });

    return;
  }

  if (current.count >= limit) {
    throw new ApiErrorResponse("rate_limited", "Too many requests. Please try again later.", 429);
  }

  buckets.set(bucketKey, {
    ...current,
    count: current.count + 1,
  });
}
