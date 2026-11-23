import { describe, expect, it } from "vitest";
import { getCoverStyle } from "../../src/utils/cover";

describe("getCoverStyle", () => {
	it("returns the same style for the same slug", () => {
		expect(getCoverStyle("mein-erster-post")).toEqual(
			getCoverStyle("mein-erster-post"),
		);
	});

	it("stays inside the known motif and palette ranges", () => {
		const style = getCoverStyle("irgendein-slug");
		expect(["contours", "trail", "waves", "sunrise", "compass"]).toContain(
			style.motif,
		);
		expect(style.palette).toBeGreaterThanOrEqual(0);
		expect(style.palette).toBeLessThan(4);
	});
});
