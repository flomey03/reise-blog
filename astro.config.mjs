import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig, fontProviders, sessionDrivers } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";
import { memberGroupsPlugin } from "./src/plugins/member-groups/index.ts";

/**
 * Storage locations. Local development keeps the defaults next to the repo;
 * the container sets these to paths on a mounted volume so data survives
 * `docker compose down`.
 */
const dataDir = process.env.EMDASH_DATA_DIR;
const dbPath = process.env.EMDASH_DB_PATH ?? "./data.db";
const uploadsDir = process.env.EMDASH_UPLOADS_DIR ?? "./uploads";

export default defineConfig({
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
	// Sessions live on the data volume in the container, so restarts don't log
	// everyone out. Locally the adapter default stays in place.
	...(dataDir
		? { session: { driver: sessionDrivers.fsLite({ base: `${dataDir}/sessions` }) } }
		: {}),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: sqlite({ url: `file:${dbPath}` }),
			storage: local({
				directory: uploadsDir,
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
