/**
 * Membership groups.
 *
 * EmDash knows role levels (10 subscriber … 50 admin), but a blog needs a
 * second, orthogonal axis: who may read a post. Groups are that axis. The list
 * lives here and nowhere else — admin UI, post field and access checks all
 * read it from this module.
 *
 * The ids double as the values of the `groups` multi-select field on posts and
 * as the labels an editor sees there, so keep them short and readable.
 */

export const GROUP_IDS = ["public", "all", "family", "friends", "private"] as const;

export type GroupId = (typeof GROUP_IDS)[number];

export interface Group {
	id: GroupId;
	label: string;
	hint: string;
}

export const GROUPS: readonly Group[] = [
	{ id: "public", label: "Public", hint: "Visible without signing in" },
	{ id: "all", label: "All members", hint: "Every signed-in reader" },
	{ id: "family", label: "Family", hint: "Family only" },
	{ id: "friends", label: "Friends", hint: "Friends only" },
	{ id: "private", label: "Private", hint: "Selected people only" },
];

/** New posts start as members-only; clear the field to make one public. */
export const DEFAULT_POST_GROUPS: GroupId[] = ["all"];

const KNOWN_GROUPS = new Set<string>(GROUP_IDS);

export function isGroupId(value: unknown): value is GroupId {
	return typeof value === "string" && KNOWN_GROUPS.has(value);
}

/**
 * Turns whatever the database hands us into a clean list of known groups.
 *
 * A multi-select value can arrive as an array, as a JSON string, or (after a
 * manual edit) as a comma-separated string; unknown ids are dropped so a typo
 * can never widen access silently.
 */
export function parseGroups(value: unknown): GroupId[] {
	const raw = Array.isArray(value)
		? value
		: typeof value === "string"
			? value.startsWith("[")
				? safeJsonArray(value)
				: value.split(",")
			: [];

	const groups = raw.map((entry) => String(entry).trim()).filter(isGroupId);
	return [...new Set(groups)];
}

function safeJsonArray(value: string): unknown[] {
	try {
		const parsed: unknown = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function sharesGroup(
	mine: readonly GroupId[],
	theirs: readonly GroupId[],
): boolean {
	return mine.some((group) => theirs.includes(group));
}

export function groupLabel(id: GroupId): string {
	return GROUPS.find((group) => group.id === id)?.label ?? id;
}
