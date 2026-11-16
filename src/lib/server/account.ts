import { withEmDashRuntime } from "emdash/middleware";
import { MEMBER_ROLE } from "../../plugins/member-groups/roles";

/**
 * Makes sure an account exists for the address before a sign-in link is sent.
 *
 * Existing accounts are left untouched. A new account is only created when the
 * address' domain is allowlisted (EmDash: Settings → Security); the domain's
 * default role is used, but never below MEMBER_ROLE.
 *
 * Returns `false` when the address may not sign in. Callers answer generically
 * either way, so nobody can probe for registered addresses.
 */
export async function ensureAccountForEmail(email: string): Promise<boolean> {
	const domain = email.slice(email.lastIndexOf("@") + 1);
	if (!domain) return false;

	return withEmDashRuntime(async ({ db }) => {
		const existing = await db
			.selectFrom("users")
			.select(["id"])
			.where("email", "=", email)
			.executeTakeFirst();
		if (existing) return true;

		const allowedDomain = await db
			.selectFrom("allowed_domains")
			.select(["default_role"])
			.where("domain", "=", domain)
			.where("enabled", "=", 1)
			.executeTakeFirst();
		if (!allowedDomain) return false;

		await db
			.insertInto("users")
			.values({
				id: crypto.randomUUID(),
				email,
				name: null,
				avatar_url: null,
				role: Math.max(Number(allowedDomain.default_role) || MEMBER_ROLE, MEMBER_ROLE),
				// Proven by the sign-in link that follows.
				email_verified: 0,
				data: null,
			})
			.execute();

		return true;
	});
}
