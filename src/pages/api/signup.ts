import type { APIRoute } from "astro";
import { getSiteSettings } from "emdash";
import { withEmDashRuntime } from "emdash/middleware";
import { MEMBER_ROLE } from "../../lib/members";
import { sendLoginLink } from "../../lib/server/login-link";
import { createRateLimiter } from "../../lib/server/rate-limit";
import {
	EMAIL_PATTERN,
	jsonResponse,
	readJsonBody,
	readString,
} from "../../lib/server/http";

export const prerender = false;

/**
 * Self-service registration.
 *
 * A visitor may sign up with an address from a domain an admin allowlisted
 * (EmDash: Settings → Security). We create the account with the domain's
 * default role and immediately mail a sign-in link — the click on that link
 * proves the address belongs to the visitor.
 */

const limiter = createRateLimiter(5, 10 * 60 * 1000);

const GENERIC = { ok: true };

export const POST: APIRoute = async ({ request, url, clientAddress }) => {
	if (!limiter.attempt(clientAddress ?? "unknown")) return jsonResponse(GENERIC);

	const body = await readJsonBody(request);
	const email = readString(body, "email").toLowerCase();
	if (!EMAIL_PATTERN.test(email)) return jsonResponse(GENERIC);

	const allowed = await ensureAccount(email).catch((error) => {
		console.error("[signup] could not prepare account:", error);
		return false;
	});
	if (!allowed) return jsonResponse(GENERIC);

	const { title } = await getSiteSettings();

	await sendLoginLink({
		email,
		origin: url.origin,
		siteName: title ?? "Blog",
	}).catch((error) => {
		console.error("[signup] failed to send sign-in link:", error);
	});

	return jsonResponse(GENERIC);
};

/**
 * Creates the account when the address' domain is allowlisted. Existing
 * accounts are left untouched (signing up again just mails another link).
 */
async function ensureAccount(email: string): Promise<boolean> {
	const domain = email.slice(email.lastIndexOf("@") + 1);
	if (!domain) return false;

	return withEmDashRuntime(async ({ db }) => {
		const allowedDomain = await db
			.selectFrom("allowed_domains")
			.select(["default_role"])
			.where("domain", "=", domain)
			.where("enabled", "=", 1)
			.executeTakeFirst();
		if (!allowedDomain) return false;

		const existing = await db
			.selectFrom("users")
			.select(["id"])
			.where("email", "=", email)
			.executeTakeFirst();
		if (existing) return true;

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
