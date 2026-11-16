import { defineMiddleware } from "astro:middleware";
import { ADMIN_PANEL_MIN_ROLE } from "./plugins/member-groups/roles";

/**
 * Two rules, applied before EmDash renders anything:
 *
 * 1. Readers never see the CMS shell. EmDash guards its API, but serves the
 *    admin HTML to any session; anyone below Contributor goes back to the site.
 * 2. The site is a members area. Anonymous visitors are sent to the login page,
 *    which doubles as the "you are not signed in" landing page and remembers
 *    where they wanted to go.
 *
 * Both checks read the Astro session, which EmDash fills with `{ id }` when a
 * user signs in — no extra database query needed.
 */

const ADMIN_PREFIX = "/_emdash/admin";
const CMS_PREFIX = "/_emdash";

/** Reachable without a session: signing in, plus static and machine routes. */
const PUBLIC_PATHS = new Set([
	"/login",
	"/login/confirm",
	"/no-access",
	"/favicon.ico",
	"/robots.txt",
]);

const PUBLIC_PREFIXES = ["/api/", "/_astro/", "/fonts/", "/_emdash/api/media/"];

function isPublic(pathname: string): boolean {
	if (PUBLIC_PATHS.has(pathname)) return true;
	if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
	return pathname.startsWith("/_emdash/api/");
}

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	const signedIn = Boolean(await context.session?.get("user"));

	// /_emdash/* keeps EmDash's own behaviour (login, setup, API).
	if (pathname.startsWith(CMS_PREFIX)) {
		const response = await next();
		if (!pathname.startsWith(ADMIN_PREFIX) || !signedIn) return response;

		const role = context.locals.user?.role ?? 0;
		if (role >= ADMIN_PANEL_MIN_ROLE) return response;
		return context.redirect("/");
	}

	if (signedIn || isPublic(pathname)) return next();

	if (context.request.method !== "GET" && context.request.method !== "HEAD") {
		return next();
	}

	const target = `${pathname}${context.url.search}`;
	return context.redirect(`/login?next=${encodeURIComponent(target)}`);
});
