import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig, fontProviders, sessionDrivers } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";
import { memberGroupsPlugin } from "./src/plugins/member-groups/index.ts";

/**
 * Everything the site persists lives under ./data. In the container the data
 * volume is mounted at /app/data, so these relative paths resolve there; local
 * development keeps the same layout next to the repo.
 */
const dataDir = "./data";

export default defineConfig({
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
	// Sessions live on the data volume in the container, so restarts don't log
	// everyone out.
	session: { driver: sessionDrivers.fsLite({ base: `${dataDir}/sessions` }) },
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: sqlite({ url: `file:${dataDir}/data.db` }),
			storage: local({
				directory: `${dataDir}/uploads`,
				baseUrl: "/_emdash/api/media/file",
			}),
      sandboxRunner: "@emdash-cms/sandbox-workerd/sandbox",
      // Keeps readers (Subscribers) out of the CMS shell; see src/middleware.ts
      middleware: { outer: "./src/middleware.ts" },
      plugins: [memberGroupsPlugin()],
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-body",
			weights: [400, 500, 600, 700],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-mono",
			weights: [400, 500],
			fallbacks: ["monospace"],
		},
	],
	devToolbar: { enabled: false },
});
