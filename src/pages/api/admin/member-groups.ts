import type { APIRoute } from "astro";
import { ADMIN_ROLE } from "../../../lib/members";
import { parseGroups } from "../../../lib/groups";
import { listMembers, setMemberGroups } from "../../../lib/server/member-groups";

export const prerender = false;

/**
 * Group membership of every account.
 *
 * Serves two callers: the Astro page `/members` (form posts, redirect back)
 * and the admin panel page, which speaks JSON. Admin only.
 */

function forbidden(): Response {
	return new Response("Nicht erlaubt", { status: 403 });
}

function isAdmin(locals: App.Locals): boolean {
	return (locals.user?.role ?? 0) >= ADMIN_ROLE;
}

export const GET: APIRoute = async ({ locals }) => {
	if (!isAdmin(locals)) return forbidden();
	return Response.json({ members: await listMembers() });
};

export const POST: APIRoute = async ({ request, locals, redirect }) => {
	if (!isAdmin(locals)) return forbidden();

	const json = request.headers.get("content-type")?.includes("application/json");

	let userId = "";
	let groups: ReturnType<typeof parseGroups> = [];

	if (json) {
		const payload = (await request.json().catch(() => null)) as Record<
			string,
			unknown
		> | null;
		userId = String(payload?.userId ?? "");
		groups = parseGroups(payload?.groups);
	} else {
		const form = await request.formData();
		userId = String(form.get("userId") ?? "");
		groups = parseGroups(form.getAll("groups"));
	}

	if (!userId) {
		return json
			? Response.json({ ok: false }, { status: 400 })
			: redirect("/members", 303);
	}

	const saved = await setMemberGroups(userId, groups).catch((error) => {
		console.error("[members] could not save groups:", error);
		return false;
	});

	if (json) return Response.json({ ok: saved });
	return redirect(okPath(saved), 303);
};

function okPath(saved: boolean): string {
	return saved ? "/members?gespeichert=1" : "/members?fehler=speichern";
}
