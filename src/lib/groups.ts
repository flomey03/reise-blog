/**
 * Membership groups.
 *
 * EmDash knows role levels (10 subscriber … 50 admin), but a blog needs a
 * second, orthogonal axis: who may read a post. Groups are that axis. The list
 * lives here and nowhere else — the admin UI, the post field and the access
 * checks all read it from this module.
 *
 * The ids double as the values of the `groups` multi-select field on posts and
 * the labels an editor sees there, which is why they are German.
 */

export const GROUP_IDS = [
	"oeffentlich",
	"alle",
	"familie",
	"freunde",
	"privat",
] as const;

export type GroupId = (typeof GROUP_IDS)[number];

export interface Group {
	id: GroupId;
	label: string;
	hint: string;
}

export const GROUPS: readonly Group[] = [
	{
		id: "oeffentlich",
		label: "Öffentlich",
		hint: "Auch ohne Anmeldung sichtbar",
	},
	{ id: "alle", label: "Alle", hint: "Jeder angemeldete Leser" },
	{ id: "familie", label: "Familie", hint: "Nur Familie" },
	{ id: "freunde", label: "Freunde", hint: "Nur Freunde" },
	{ id: "privat", label: "Privat", hint: "Nur ausgewählte Personen" },
];

/** New posts start as members-only; clear the field to make one public. */
export const DEFAULT_POST_GROUPS: GroupId[] = ["alle"];

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
