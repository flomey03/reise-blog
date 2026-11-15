import type { AstroGlobal } from "astro";

/**
 * Role levels are EmDash's RBAC scale:
 * 10 subscriber, 20 contributor, 30 author, 40 editor, 50 admin.
 *
 * Everything at or above Subscriber counts as a signed-in member; higher roles
 * inherit the lower ones, so a contributor can read member content too.
 */
export const MEMBER_ROLE = 10;

export function currentRole(locals: App.Locals): number {
	return locals.user?.role ?? 0;
}

export function isMember(locals: App.Locals): boolean {
	return currentRole(locals) >= MEMBER_ROLE;
}

/**
 * Guard for members-only pages.
 *
 * ```astro
 * const denied = requireMember(Astro);
 * if (denied) return denied;
 * ```
 *
 * Returns `null` when the visitor may see the page, otherwise a redirect to
 * the login page.
 */
export function requireMember(Astro: AstroGlobal): Response | null {
	if (isMember(Astro.locals)) return null;
	return Astro.redirect("/login");
}
