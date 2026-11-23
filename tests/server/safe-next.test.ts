import { describe, expect, it } from "vitest";
import { safeNext } from "../../src/lib/server/login-link";

describe("safeNext", () => {
	it("keeps local paths including their query string", () => {
		expect(safeNext("/posts/foo?x=1")).toBe("/posts/foo?x=1");
	});

	it("rejects protocol-relative and external targets", () => {
		expect(safeNext("//evil.example")).toBeNull();
		expect(safeNext("https://evil.example")).toBeNull();
	});

	it("rejects empty values", () => {
		expect(safeNext("")).toBeNull();
		expect(safeNext(null)).toBeNull();
		expect(safeNext(undefined)).toBeNull();
	});
});
