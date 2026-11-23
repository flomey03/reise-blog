import { withEmDashRuntime } from "emdash/middleware";
import { MEMBER_ROLE } from "../../plugins/member-groups/roles";

/**
 * Makes sure an account exists for the address before a sign-in link is sent.
 *
 * Existing accounts are left untouched. A new account is only created when an
 * enabled `allowed_domains` entry matches the address: an exact domain, a
 * suffix wildcard like `*.de`, or the global `*`. More specific entries win.
 * The matched entry's default role is used, but never below MEMBER_ROLE.
 *
 * Returns `false` when the address may not sign in. Callers answer generically
 * either way, so nobody can probe for registered addresses.
 */
function matchesDomain(pattern: string, domain: string): boolean {
	const normalized = pattern.trim().toLowerCase();
	if (normalized === "*") return true;
	if (normalized.startsWith("*.")) {
		const suffix = normalized.slice(2);
		return Boolean(suffix) && (domain === suffix || domain.endsWith(`.${suffix}`));
	}
	return normalized === domain;
}

/** Exact entries beat suffix wildcards, which beat the global `*`. */
function domainSpecificity(pattern: string): number {
	const normalized = pattern.trim().toLowerCase();
	if (normalized === "*") return 0;
	if (normalized.startsWith("*.")) return 1_000 + normalized.length;
	return 10_000 + normalized.length;
}

/**
 * Readable fallback until members can pick their own display name. The local
 * part is already validated as non-empty by `ensureAccountForEmail`.
 */
export function displayNameFromEmail(email: string): string {
	return email.slice(0, email.lastIndexOf("@")) || "Mitglied";
}

export async function ensureAccountForEmail(email: string): Promise<boolean> {
	const at = email.lastIndexOf("@");
	if (at <= 0) return false;
	const domain = email.slice(at + 1).toLowerCase();
	if (!domain || domain.includes("@")) return false;

	return withEmDashRuntime(async ({ db }) => {
		const existing = await db
			.selectFrom("users")
			.select(["id"])
			.where("email", "=", email)
			.executeTakeFirst();
		if (existing) return true;

		const allowedDomains = await db
			.selectFrom("allowed_domains")
			.select(["domain", "default_role"])
			.where("enabled", "=", 1)
			.execute();
		const allowedDomain = allowedDomains
			.filter((entry) => matchesDomain(entry.domain, domain))
			.sort((a, b) => domainSpecificity(b.domain) - domainSpecificity(a.domain))[0];
		if (!allowedDomain) return false;

		await db
			.insertInto("users")
			.values({
				id: crypto.randomUUID(),
				email,
				name: displayNameFromEmail(email),
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
