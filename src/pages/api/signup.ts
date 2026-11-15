import type { APIRoute } from "astro";
import { withEmDashRuntime } from "emdash/middleware";

export const prerender = false;

/**
 * Self-service registration for readers.
 *
 * Flow: the visitor enters an email address. If the address belongs to an
 * allowed domain (EmDash: Settings -> Security -> allowed domains), a user
 * with the domain's default role is created and EmDash's own magic-link
 * endpoint sends the sign-in link. Clicking that link proves ownership of the
 * address and creates the session -- no password, no passkey needed.
 *
 * Everything below deliberately answers with the same generic payload so the
 * endpoint cannot be used to enumerate accounts.
 */

const OK = { ok: true };

/** Highest number of registration attempts per IP inside the window. */
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
	const now = Date.now();
	const entry = attempts.get(key);
	if (!entry || entry.resetAt <= now) {
		attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
		return false;
	}
	entry.count += 1;
	return entry.count > MAX_ATTEMPTS;
}

/** Deliberately simple: one @, a dot in the domain, no whitespace. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Subscribers (10) are the lowest role and the right default for readers. */
const MEMBER_ROLE = 10;

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});
}

export const POST: APIRoute = async ({ request, url, clientAddress }) => {
	if (isRateLimited(clientAddress ?? "unknown")) return json(OK);

	let email = "";
	try {
		const body = (await request.json()) as { email?: unknown };
		if (typeof body?.email === "string") email = body.email.trim().toLowerCase();
	} catch {
		return json(OK);
	}
	if (!EMAIL_PATTERN.test(email)) return json(OK);

	const domain = email.slice(email.lastIndexOf("@") + 1);
	if (!domain) return json(OK);

	// Allowed-domain check and account creation share one runtime scope.
	const allowed = await withEmDashRuntime(async (runtime) => {
		const db = runtime.db;

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

		const role = Math.max(Number(allowedDomain.default_role) || MEMBER_ROLE, MEMBER_ROLE);
		await db
			.insertInto("users")
			.values({
				id: crypto.randomUUID(),
				email,
				name: null,
				avatar_url: null,
				role,
				// Set once the visitor clicks the link we send below; until then
				// the address is unproven.
				email_verified: 0,
				data: null,
			})
			.execute();

		return true;
	}).catch((error) => {
		console.error("[signup] failed to prepare account:", error);
		return false;
	});

	if (allowed) {
		// EmDash's own endpoint builds the token, stores the hash and sends the
		// mail through whichever email provider is active (console in dev).
		await fetch(new URL("/_emdash/api/auth/magic-link/send", url.origin), {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ email }),
		}).catch((error) => {
			console.error("[signup] failed to send sign-in link:", error);
		});
	}

	return json(OK);
};
