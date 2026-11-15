import type { AstroGlobal } from "astro";
import { parseGroups, sharesGroup, type GroupId } from "./groups";

/**
 * Role levels are EmDash's RBAC scale:
 * 10 subscriber, 20 contributor, 30 author, 40 editor, 50 admin.
 *
 * Everything at or above Subscriber counts as a signed-in member; higher roles
 * inherit the lower ones, so a contributor can read member content too.
 */
export const MEMBER_ROLE = 10;
export const ADMIN_ROLE = 50;

/**
 * Lowest role that may use the CMS. Subscribers (10) are readers; from
 * Contributor (20) upwards an account can write or edit content.
 */
export const ADMIN_PANEL_MIN_ROLE = 20;

export function currentRole(locals: App.Locals): number {
	return locals.user?.role ?? 0;
}

export function isMember(locals: App.Locals): boolean {
	return currentRole(locals) >= MEMBER_ROLE;
}

export function isAdmin(locals: App.Locals): boolean {
	return currentRole(locals) >= ADMIN_ROLE;
}

/** The groups an account belongs to, stored in `users.data.groups`. */
export function memberGroups(locals: App.Locals): GroupId[] {
	return parseGroups(locals.user?.data?.groups);
}

/**
 * Whether the current visitor may read a post.
 *
 * - A post without groups, or with "public", is public.
 * - Editors and admins always see everything.
 * - Otherwise the visitor has to be signed in, and either the post is for
 *   everyone ("all") or the visitor's groups overlap the post's groups.
 */
export function canReadPost(
	locals: App.Locals,
	postGroups: unknown,
): boolean {
	const groups = parseGroups(postGroups);
	if (groups.length === 0) return true;
	if (groups.includes("public")) return true;
	if (isAdmin(locals)) return true;
	if (!isMember(locals)) return false;
	if (groups.includes("all")) return true;
	return sharesGroup(memberGroups(locals), groups);
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
