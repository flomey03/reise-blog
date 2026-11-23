import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("emdash", () => ({
	getEntryTerms: vi.fn(),
	getTermsForEntries: vi.fn(),
}));

import { getEntryTerms, getTermsForEntries } from "emdash";
import {
	ALL_MEMBERS_GROUP,
	canRead,
	filterReadable,
	parseGroups,
	sharesGroup,
} from "../../../src/plugins/member-groups/access";

interface Term {
	slug: string;
}

interface TestEntry {
	data: {
		id: string;
		terms?: Record<string, Term[]>;
	};
}

const TAXONOMY = "member-group";

function locals(role: number | undefined, groups: string[] = []) {
	return {
		user: role === undefined ? undefined : { role, data: { groups } },
	} as never;
}

function entry(id: string, terms?: Record<string, Term[]>): TestEntry {
	return { data: { id, terms } };
}

beforeEach(() => {
	vi.mocked(getEntryTerms).mockReset();
	vi.mocked(getTermsForEntries).mockReset();
});

describe("parseGroups", () => {
	it("normalises arrays, JSON strings and comma lists", () => {
		expect(parseGroups([" a ", "b", "a"])).toEqual(["a", "b"]);
		expect(parseGroups('["x", " y "]')).toEqual(["x", "y"]);
		expect(parseGroups("x, y, x")).toEqual(["x", "y"]);
		expect(parseGroups(undefined)).toEqual([]);
	});
});

describe("sharesGroup", () => {
	it("detects an overlap in either direction", () => {
		expect(sharesGroup(["a", "b"], ["b"])).toBe(true);
		expect(sharesGroup(["a"], ["a", "b"])).toBe(true);
		expect(sharesGroup(["a"], ["b"])).toBe(false);
		expect(sharesGroup([], [])).toBe(false);
	});
});

describe("canRead", () => {
	it("lets anyone read an entry without group terms", async () => {
		const result = await canRead(
			locals(undefined),
			entry("public", { [TAXONOMY]: [] }),
			TAXONOMY,
		);

		expect(result).toBe(true);
		expect(getEntryTerms).not.toHaveBeenCalled();
	});

	it("opens the all-members term only to signed-in members", async () => {
		const allMembers = entry("all", {
			[TAXONOMY]: [{ slug: ALL_MEMBERS_GROUP }],
		});

		expect(await canRead(locals(10), allMembers, TAXONOMY)).toBe(true);
		expect(await canRead(locals(undefined), allMembers, TAXONOMY)).toBe(false);
	});

	it("matches overlapping groups", async () => {
		const restricted = entry("restricted", {
			[TAXONOMY]: [{ slug: "redaktion" }, { slug: "team" }],
		});

		expect(await canRead(locals(10, ["team"]), restricted, TAXONOMY)).toBe(true);
		expect(await canRead(locals(10, ["crew"]), restricted, TAXONOMY)).toBe(false);
	});

	it("lets admins read restricted entries", async () => {
		const restricted = entry("restricted", {
			[TAXONOMY]: [{ slug: "geheim" }],
		});

		expect(await canRead(locals(50), restricted, TAXONOMY)).toBe(true);
	});

	it("falls back to getEntryTerms for entries without hydrated terms", async () => {
		vi.mocked(getEntryTerms).mockResolvedValue([{ slug: "team" }]);

		expect(await canRead(locals(10, ["team"]), entry("from-list"), TAXONOMY)).toBe(
			true,
		);
		expect(getEntryTerms).toHaveBeenCalledWith("posts", "from-list", TAXONOMY);
	});
});

describe("filterReadable", () => {
	it("returns all entries untouched for admins", async () => {
		const entries = [entry("a"), entry("b")];

		expect(await filterReadable(locals(50), entries, TAXONOMY)).toBe(entries);
		expect(getTermsForEntries).not.toHaveBeenCalled();
	});

	it("keeps public entries and drops restricted ones for anonymous visitors", async () => {
		vi.mocked(getTermsForEntries).mockResolvedValue(
			new Map<string, Term[]>([
				["public", []],
				["secret", [{ slug: "geheim" }]],
				["all", [{ slug: ALL_MEMBERS_GROUP }]],
			]),
		);

		const result = await filterReadable(
			locals(undefined),
			[entry("public"), entry("secret"), entry("all")],
			TAXONOMY,
		);

		expect(result.map((item) => item.data.id)).toEqual(["public"]);
	});

	it("keeps entries from the visitor's own group", async () => {
		vi.mocked(getTermsForEntries).mockResolvedValue(
			new Map<string, Term[]>([
				["public", []],
				["secret", [{ slug: "geheim" }]],
				["team", [{ slug: "team" }]],
			]),
		);

		const result = await filterReadable(
			locals(10, ["team"]),
			[entry("public"), entry("secret"), entry("team")],
			TAXONOMY,
		);

		expect(result.map((item) => item.data.id)).toEqual(["public", "team"]);
	});
});
