import { defineMiddleware } from "astro:middleware";
import { ADMIN_PANEL_MIN_ROLE } from "./lib/members";

/**
 * Keeps readers out of the CMS.
 *
 * EmDash guards its API (a Subscriber gets 403 on admin endpoints), but the
 * admin shell itself is served to anyone with a session. Readers never need
 * it, so anyone below Contributor is sent back to the site.
 *
 * Anonymous visitors are left alone: EmDash redirects them to its own login,
 * which is where the first admin account is created.
 */
const ADMIN_PREFIX = "/_emdash/admin";

export const onRequest = defineMiddleware(async (context, next) => {
	const response = await next();

	if (!context.url.pathname.startsWith(ADMIN_PREFIX)) return response;

	const role = context.locals.user?.role ?? 0;
	if (role === 0 || role >= ADMIN_PANEL_MIN_ROLE) return response;

	return context.redirect("/");
});
