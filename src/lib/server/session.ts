import type { APIContext } from "astro";

/**
 * Starts a member session after the sign-in link was verified.
 *
 * Astro's session cookie options are global: they come from `astro.config.mjs`
 * and are compiled into the manifest at startup. `session.set()` therefore
 * always queues the same cookie, with no way to pass a per-login lifetime.
 *
 * For readers who opt into 30 days we replace that queued cookie here. Astro
 * keeps outgoing cookies in a map keyed by name, so setting the same name again
 * wins. Everything else about the cookie stays identical to Astro's defaults.
 *
 * Keeping this in one place is the point: the route only decides *who* signs
 * in and *whether* they opted in, not how the cookie is assembled.
 */

/** Astro's default name; no custom `cookie.name` is configured. */
const SESSION_COOKIE = "astro-session";
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30;

export interface StartMemberSessionOptions {
	remember: boolean;
}

export function startMemberSession(
	context: APIContext,
	userId: string,
	{ remember }: StartMemberSessionOptions,
): void {
	context.session?.set("user", { id: userId });

	if (!remember) return;

	const value = context.cookies.get(SESSION_COOKIE)?.value;
	if (!value) return;

	context.cookies.set(SESSION_COOKIE, value, {
		maxAge: REMEMBER_MAX_AGE,
		path: "/",
		sameSite: "lax",
		secure: import.meta.env.PROD,
		httpOnly: true,
	});
}
