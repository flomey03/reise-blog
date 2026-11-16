/**
 * Role helpers shared by the plugin's pages, routes, and the site's own
 * middleware. EmDash stores the role as a number on `locals.user`.
 */
export const MEMBER_ROLE = 10;
export const ADMIN_ROLE = 50;
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
