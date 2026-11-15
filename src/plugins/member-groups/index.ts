import type { PluginDescriptor } from "emdash";

/**
 * Admin page for member groups.
 *
 * Config-level plugins are declared as descriptors whose `entrypoint` is a
 * module exporting `createPlugin()`; the admin page itself is wired through
 * `adminEntry`. See `plugin.ts` and `admin.tsx`.
 */
export function memberGroupsPlugin(options = {}): PluginDescriptor {
	return {
		id: "member-groups",
		version: "1.0.0",
		entrypoint: "/src/plugins/member-groups/plugin.ts",
		adminEntry: "/src/plugins/member-groups/admin.tsx",
		options,
	};
}
