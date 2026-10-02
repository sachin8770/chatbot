/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach per IP address.
 *
 * Note: This is per-process — if you scale to multiple instances,
 * replace with Redis-backed rate limiting.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 60_000);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Check if a request should be rate limited.
 *
 * @param identifier - Unique identifier for the client (e.g., IP or userId)
 * @param action - The action being rate limited (e.g., "login", "index-pdf")
 * @param options - Rate limit configuration
 * @returns RateLimitResult with allowed status and metadata
 */
export function checkRateLimit(
  identifier: string,
  action: string,
  options: RateLimitOptions
): RateLimitResult {
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= options.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const resetMs = oldestInWindow + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetMs,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: options.maxRequests - entry.timestamps.length,
    resetMs: 0,
  };
}

/**
 * Extract client IP from the request headers.
 * Works with proxies (X-Forwarded-For) and direct connections.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}
