/**
 * Small, dependency-free limiter for the single-instance/dev deployment.
 *
 * It intentionally lives behind this module so a shared store (for example an
 * existing platform cache) can replace only this implementation when the app
 * is deployed on more than one server. Do not treat the in-memory fallback as
 * a distributed production rate-limit store.
 */
export type RateLimitPolicy = Readonly<{ limit: number; windowMs: number }>;

type Counter = { count: number; resetAt: number };
type Store = Map<string, Counter>;

declare global {
  // Kept on globalThis so Next hot reloads do not reset limits on every module reload.
  var __salonomiaRateLimitStore: Store | undefined;
}

const store: Store = globalThis.__salonomiaRateLimitStore ?? new Map<string, Counter>();
globalThis.__salonomiaRateLimitStore = store;

export const rateLimits = {
  authentication: { limit: 8, windowMs: 15 * 60_000 },
  availability: { limit: 90, windowMs: 60_000 },
  booking: { limit: 8, windowMs: 15 * 60_000 },
  bookingManage: { limit: 12, windowMs: 15 * 60_000 },
  walkIn: { limit: 30, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitPolicy>;

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number; retryAfterSeconds: number };

export function clientAddress(headers: Headers): string {
  // Hosting proxies append the connecting client. We use the first normalized
  // value and never reflect it to a response or log it as user data.
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || headers.get("x-real-ip")?.trim() || "unknown";
  return address.slice(0, 128);
}

export function checkRateLimit(scope: string, identity: string, policy: RateLimitPolicy, now = Date.now()): RateLimitResult {
  const key = `${scope}:${identity}`;
  const current = store.get(key);
  const counter = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + policy.windowMs }
    : current;
  counter.count += 1;
  store.set(key, counter);

  const remaining = Math.max(0, policy.limit - counter.count);
  return {
    allowed: counter.count <= policy.limit,
    remaining,
    resetAt: counter.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((counter.resetAt - now) / 1000)),
  };
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "Cache-Control": "no-store",
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed ? {} : { "Retry-After": String(result.retryAfterSeconds) }),
  };
}

/** Test-only reset; not used by application code. */
export function resetRateLimitStore(): void { store.clear(); }
