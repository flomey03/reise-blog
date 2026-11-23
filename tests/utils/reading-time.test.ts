import type { PortableTextBlock } from "emdash";
import { describe, expect, it } from "vitest";
import { extractText, getReadingTime } from "../../src/utils/reading-time";

function blocks(...texts: string[]): PortableTextBlock[] {
	return texts.map((text) => ({
		_type: "block",
		children: [{ _type: "span", text }],
	})) as unknown as PortableTextBlock[];
}

describe("extractText", () => {
	it("joins the span text of all blocks", () => {
		expect(extractText(blocks("Hallo", "Welt"))).toBe("Hallo Welt");
	});

	it("returns an empty string when there is no content", () => {
		expect(extractText(undefined)).toBe("");
		expect(extractText([])).toBe("");
	});
});

describe("getReadingTime", () => {
	it("never returns less than one minute", () => {
		expect(getReadingTime(blocks("kurz"))).toBe(1);
	});

	it("rounds up past 200 words", () => {
		const text = Array.from({ length: 201 }, (_, index) => `wort${index}`).join(
			" ",
		);
		expect(getReadingTime(blocks(text))).toBe(2);
	});
});
