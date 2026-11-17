import type { APIRoute } from "astro";
import { verifyMagicLink } from "@emdash-cms/auth";
import { createKyselyAdapter } from "@emdash-cms/auth/adapters/kysely";
import { withEmDashRuntime } from "emdash/middleware";
import { startMemberSession } from "../../../lib/server/session";
import { safeNext } from "../../../lib/server/login-link";

export const prerender = false;

/**
 * Consumes a sign-in link.
 *
 * The confirmation page posts here, which keeps mail scanners (they only ever
 * issue GETs) from burning the single-use token. The checkbox there opts into
 * a 30-day cookie; without it the session cookie dies with the browser.
 */
export const POST: APIRoute = async (context) => {
	const { request, session, redirect } = context;
	const form = await request.formData();
	const token = String(form.get("token") ?? "");
	const next = safeNext(String(form.get("next") ?? "")) ?? "/";
	const remember = form.get("remember") === "1";

	if (!token || !session) return redirect("/login", 303);

	const user = await withEmDashRuntime(async ({ db }) => {
		const adapter = createKyselyAdapter(db);
		return verifyMagicLink(adapter, token);
	}).catch((error) => {
		console.error("[login] link could not be verified:", error);
		return null;
	});

	if (!user) return redirect("/login?error=link", 303);

	startMemberSession(context, user.id, { remember });

	await withEmDashRuntime(({ db }) =>
		db
			.updateTable("users")
			.set({ email_verified: 1 })
			.where("id", "=", user.id)
			.execute(),
	).catch((error) => {
		console.error("[login] could not mark address as verified:", error);
	});

	return redirect(next, 303);
};
