import { getEntryTerms, getTermsForEntries } from "emdash";
import { isAdmin, isMember } from "./roles";

/**
 * Post access, driven by a member-group taxonomy.
 *
 * A post is readable by everyone when it carries no term of that taxonomy;
 * the special `all` term opens it to any signed-in member. Otherwise access is
 * the overlap of the post's terms and the visitor's assigned groups.
 */
export const ALL_MEMBERS_GROUP = "all";

interface TermLike {
	slug: string;
}

interface ReadableEntry {
	data: {
		id: string;
		terms?: Record<string, TermLike[]>;
	};
}

/** Normalise a stored value (array, JSON string, or comma list) into slugs. */
export function parseGroups(value: unknown): string[] {
	const raw = Array.isArray(value)
		? value
		: typeof value === "string"
			? value.startsWith("[")
				? safeJsonArray(value)
				: value.split(",")
			: [];
	const groups = raw
		.map((entry) => String(entry).trim())
		.filter((entry) => entry.length > 0);
	return [...new Set(groups)];
}

function safeJsonArray(value: string): unknown[] {
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function sharesGroup(mine: string[], theirs: string[]): boolean {
	return mine.some((group) => theirs.includes(group));
}

/** The groups assigned to the signed-in visitor. */
function viewerGroups(locals: App.Locals): string[] {
	return parseGroups(locals.user?.data?.groups);
}

async function entryGroups(
	entry: ReadableEntry,
	taxonomy: string,
	collection: string,
): Promise<string[]> {
	// A single entry is hydrated with its terms; list entries are not.
	const hydrated = entry.data.terms?.[taxonomy];
	const terms =
		hydrated ?? (await getEntryTerms(collection, entry.data.id, taxonomy));
	return terms.map((term) => term.slug);
}

/** Whether the visitor may read one entry of a member-group taxonomy. */
export async function canRead(
	locals: App.Locals,
	entry: ReadableEntry,
	taxonomy: string,
	collection = "posts",
): Promise<boolean> {
	const groups = await entryGroups(entry, taxonomy, collection);
	if (groups.length === 0) return true;
	if (isAdmin(locals)) return true;
	if (!isMember(locals)) return false;
	if (groups.includes(ALL_MEMBERS_GROUP)) return true;
	return sharesGroup(viewerGroups(locals), groups);
}

/** Filter a list of entries using one batched term query. */
export async function filterReadable<T extends ReadableEntry>(
	locals: App.Locals,
	entries: T[],
	taxonomy: string,
	collection = "posts",
): Promise<T[]> {
	if (entries.length === 0 || isAdmin(locals)) return entries;
	const termsByEntry = await getTermsForEntries(
		collection,
		entries.map((entry) => entry.data.id),
		taxonomy,
	);
	const member = isMember(locals);
	const mine = viewerGroups(locals);
	return entries.filter((entry) => {
		const groups = (termsByEntry.get(entry.data.id) ?? []).map((t) => t.slug);
		if (groups.length === 0) return true;
		if (!member) return false;
		if (groups.includes(ALL_MEMBERS_GROUP)) return true;
		return sharesGroup(mine, groups);
	});
}
