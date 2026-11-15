import type { APIRoute } from "astro";
import { verifyMagicLink } from "@emdash-cms/auth";
import { createKyselyAdapter } from "@emdash-cms/auth/adapters/kysely";
import { withEmDashRuntime } from "emdash/middleware";
import { safeNext } from "../../../lib/server/login-link";

export const prerender = false;

/**
 * Consumes a sign-in link.
 *
 * The confirmation page posts here, which keeps mail scanners (they only ever
 * issue GETs) from burning the single-use token.
 */
export const POST: APIRoute = async ({ request, session, redirect }) => {
	const form = await request.formData();
	const token = String(form.get("token") ?? "");
	const next = safeNext(String(form.get("next") ?? "")) ?? "/";

	if (!token || !session) return redirect("/login", 303);

	const user = await withEmDashRuntime(async ({ db }) => {
		const adapter = createKyselyAdapter(db);
		return verifyMagicLink(adapter, token);
	}).catch((error) => {
		console.error("[login] link could not be verified:", error);
		return null;
	});

	if (!user) return redirect("/login?error=link", 303);

	session.set("user", { id: user.id });

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
