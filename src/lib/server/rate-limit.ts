/**
 * A tiny in-memory limiter for the public auth endpoints.
 *
 * It is per process, so it stops accidental floods rather than determined
 * attackers; that is the same guarantee EmDash's own per-IP limits give on a
 * single Node instance.
 */

export interface RateLimiter {
	/** Returns `true` while the caller is still inside the allowance. */
	attempt(key: string): boolean;
}

export function createRateLimiter(max: number, windowMs: number): RateLimiter {
	const buckets = new Map<string, { count: number; resetAt: number }>();

	return {
		attempt(key) {
			const now = Date.now();
			const bucket = buckets.get(key);

			if (!bucket || bucket.resetAt <= now) {
				buckets.set(key, { count: 1, resetAt: now + windowMs });
				return true;
			}

			bucket.count += 1;
			return bucket.count <= max;
		},
	};
}
