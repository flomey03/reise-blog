import { withEmDashRuntime } from "emdash/middleware";
import { parseGroups, type GroupId } from "../groups";

/**
 * Accounts and their group membership.
 *
 * EmDash has no table for this, so groups live in the `users.data` JSON blob
 * that every user row already carries. This module is the only place that
 * reads or writes it — everything else goes through these functions.
 */

export interface Member {
	id: string;
	email: string;
	name: string | null;
	role: number;
	groups: GroupId[];
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

export async function setMemberGroups(
	userId: string,
	groups: GroupId[],
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

/** The `users.data` column is nullable TEXT holding a JSON object. */
function readData(raw: string | null): Record<string, unknown> {
	if (!raw) return {};
	try {
		const parsed: unknown = JSON.parse(raw);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: {};
	} catch {
		return {};
	}
}
