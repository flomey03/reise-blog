import { getTaxonomyTerms } from "emdash";
import { withEmDashRuntime } from "emdash/middleware";
import { parseGroups } from "./access";

/**
 * Member records and their assigned groups. Groups live in `users.data.groups`,
 * which the runtime exposes only through raw database access.
 */
export interface Member {
	id: string;
	email: string;
	name: string | null;
	role: number;
	groups: string[];
}

export interface GroupOption {
	slug: string;
	label: string;
}

export async function listMembers(): Promise<Member[]> {
	return withEmDashRuntime(async ({ db }) => {
		const rows = await db
			.selectFrom("users")
			.select(["id", "email", "name", "role", "data"])
			.orderBy("created_at", "asc")
			.execute();
		return rows.map((row) => ({
			id: row.id,
			email: row.email,
			name: row.name,
			role: row.role,
			groups: parseGroups(readData(row.data).groups),
		}));
	});
}

/** The member-group terms, for the admin checkboxes. */
export async function listGroups(): Promise<GroupOption[]> {
	return withEmDashRuntime(async () => {
		const terms = await getTaxonomyTerms("member-group");
		return terms.map((term) => ({ slug: term.slug, label: term.label }));
	});
}

/** Replace a member's group list. Returns false when the user is gone. */
export async function setMemberGroups(
	userId: string,
	groups: string[],
): Promise<boolean> {
	return withEmDashRuntime(async ({ db }) => {
		const row = await db
			.selectFrom("users")
			.select(["data"])
			.where("id", "=", userId)
			.executeTakeFirst();
		if (!row) return false;
		const data = { ...readData(row.data), groups };
		await db
			.updateTable("users")
			.set({ data: JSON.stringify(data) })
			.where("id", "=", userId)
			.execute();
		return true;
	});
}

function readData(raw: string | null): Record<string, unknown> {
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: {};
	} catch {
		return {};
	}
}
