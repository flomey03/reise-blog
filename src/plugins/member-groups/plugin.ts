import { definePlugin } from "emdash";

/**
 * Runtime half of the plugin: EmDash imports this module at build time and
 * calls `createPlugin()`. Only the admin surface is used — the member data
 * lives in `users.data.groups`, not in plugin storage.
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
	});
}
