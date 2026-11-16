#!/usr/bin/env node
/*
 * Fails when site CSS hardcodes a colour or a font family instead of using a
 * design token. The point is to keep every page themable: if a component
 * writes its own colours, switching src/styles/theme.css no longer switches
 * the whole site.
 *
 * Tokens themselves live in src/styles/tokens.css; themes in
 * src/styles/themes/ may of course contain literal values.
 *
 * Allowed literals: #000 and #fff (masks and @supports feature tests), plus
 * font-family keywords such as inherit.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");
const ALLOWED_FILES = new Set(["src/styles/tokens.css"]);
const ALLOWED_DIRS = ["src/styles/themes/"];

const COLOR = /(?<![\w-])(#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|hwb|lab|lch)\()/;
const ALLOWED_COLOR = /^#(?:000|fff)$/i;
const FONT = /font-family:\s*([^;]+);/g;
const FONT_KEYWORDS = /^(?:inherit|initial|unset|revert|revert-layer)\b/;

function* walk(dir) {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) {
			yield* walk(path);
		} else if (/\.(astro|css)$/.test(entry)) {
			yield path;
		}
	}
}

const problems = [];

for (const path of walk(SRC)) {
	const rel = relative(ROOT, path);
	if (ALLOWED_FILES.has(rel)) continue;
	if (ALLOWED_DIRS.some((dir) => rel.startsWith(dir))) continue;

	const lines = readFileSync(path, "utf8").split("\n");
	lines.forEach((line, index) => {
		const color = line.match(COLOR);
		if (color && !ALLOWED_COLOR.test(color[0])) {
			problems.push(`${rel}:${index + 1}  colour \`${color[0]}\` -- use a token`);
		}

		for (const match of line.matchAll(FONT)) {
			const value = match[1].trim();
			if (!value.startsWith("var(--") && !FONT_KEYWORDS.test(value)) {
				problems.push(`${rel}:${index + 1}  font family \`${value}\` -- use a token`);
			}
		}
	});
}

if (problems.length > 0) {
	console.error("Hardcoded theme values found:\n");
	for (const problem of problems) console.error(`  ${problem}`);
	console.error("\nUse the tokens in src/styles/tokens.css, or add one there.");
	process.exit(1);
}

console.log("Theme check passed: no hardcoded colours or fonts outside tokens/themes.");
