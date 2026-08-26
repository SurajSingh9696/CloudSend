import { NextRequest } from "next/server";

const WINDOW_MS = 60_000;
const LIMIT = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

/** Lightweight per-instance throttle. Use Redis/Upstash for shared serverless deployments. */
export function allowCodeLookup(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const key = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= LIMIT) return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}
