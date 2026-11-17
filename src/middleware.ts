import { defineMiddleware } from "astro:middleware";
import { withEmDashRuntime } from "emdash/middleware";
import { ADMIN_PANEL_MIN_ROLE } from "./plugins/member-groups/roles";

/**
 * Two rules, applied before EmDash renders anything:
 *
 * 1. Readers never see the CMS shell or its API. EmDash guards the API by
 *    permission, but `content:read` already applies to Subscribers — which in
 *    this members-only site would expose every published post, including ones
 *    restricted to another member group. So the CMS API is closed to anyone
 *    below Contributor, apart from the two public bits the site itself uses.
 * 2. The site is a members area. Anonymous visitors are sent to the login page,
 *    which doubles as the "you are not signed in" landing page and remembers
 *    where they wanted to go.
 */

const ADMIN_PREFIX = "/_emdash/admin";
const CMS_PREFIX = "/_emdash";
const API_PREFIX = "/_emdash/api/";

/**
 * CMS API paths readers still need: avatars/featured images and commenting.
 * Both are already public in EmDash's own auth middleware, so letting them
 * through here does not widen access.
 */
const READER_API_PREFIXES = [
	"/_emdash/api/media/file/",
	"/_emdash/api/comments/",
];

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

function isReaderApi(pathname: string): boolean {
	return READER_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function forbidden(): Response {
	return new Response(
		JSON.stringify({
			success: false,
			error: { code: "FORBIDDEN", message: "This area is for editors." },
		}),
		{ status: 403, headers: { "Content-Type": "application/json" } },
	);
}

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	const sessionUser = await context.session?.get("user");
	const signedIn = Boolean(sessionUser);

	// /_emdash/* keeps EmDash's own behaviour (login, setup, API).
	if (pathname.startsWith(CMS_PREFIX)) {
		if (pathname.startsWith(API_PREFIX) && signedIn && !isReaderApi(pathname)) {
			// Our middleware runs before EmDash's auth middleware, so locals.user
			// isn't populated yet. Read the role from the same users table EmDash
			// uses, keyed by the id stored in the session.
			const user = await withEmDashRuntime(({ db }) =>
				db
					.selectFrom("users")
					.select("role")
					.where("id", "=", sessionUser!.id)
					.executeTakeFirst(),
			);
			if ((user?.role ?? 0) < ADMIN_PANEL_MIN_ROLE) return forbidden();
		}

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
