import { definePlugin, definePluginRoute } from "emdash";
import { parseGroups } from "./access";
import { listGroups, listMembers, setMemberGroups } from "./members";

/**
 * Member groups plugin.
 *
 * Groups are a `member-group` taxonomy; posts opt into access by carrying its
 * terms (no term = public). This plugin owns the roles helpers, the access
 * checks, and the admin page + route that assign groups to members.
 */
export function createPlugin() {
	return definePlugin({
		id: "member-groups",
		displayName: "Member groups",
		description: "Assign the groups that control post access.",
		version: "1.0.0",
		admin: {
			entry: "/src/plugins/member-groups/admin.tsx",
			pages: [{ path: "/members", label: "Members" }],
		},
		routes: {
			members: definePluginRoute({
				methods: ["GET", "POST"],
				permission: "users:manage",
				handler: async (ctx) => {
					if (ctx.request.method === "POST") {
						const input = (ctx.input ?? {}) as {
							userId?: string;
							groups?: unknown;
						};
						if (!input.userId) return { ok: false };
						const ok = await setMemberGroups(
							input.userId,
							parseGroups(input.groups),
						);
						return { ok };
					}

					const [members, groups] = await Promise.all([
						listMembers(),
						listGroups(),
					]);
					return { members, groups };
				},
			}),
		},
	});
}
