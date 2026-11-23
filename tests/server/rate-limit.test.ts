import { afterEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "../../src/lib/server/rate-limit";

afterEach(() => {
	vi.useRealTimers();
});

describe("createRateLimiter", () => {
	it("allows five attempts and blocks the sixth inside the window", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
		const limiter = createRateLimiter(5, 10 * 60 * 1000);

		for (let attempt = 0; attempt < 5; attempt++) {
			expect(limiter.attempt("1.2.3.4")).toBe(true);
		}
		expect(limiter.attempt("1.2.3.4")).toBe(false);
	});

	it("starts a fresh bucket after the window", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
		const limiter = createRateLimiter(1, 1000);

		expect(limiter.attempt("client-a")).toBe(true);
		expect(limiter.attempt("client-a")).toBe(false);

		vi.advanceTimersByTime(1001);

		expect(limiter.attempt("client-a")).toBe(true);
	});

	it("keeps separate keys apart", () => {
		const limiter = createRateLimiter(1, 1000);

		expect(limiter.attempt("client-a")).toBe(true);
		expect(limiter.attempt("client-b")).toBe(true);
	});
});
