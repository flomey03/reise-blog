import type { APIRoute } from "astro";
import { getSiteSettings } from "emdash";
import { sendLoginLink, safeNext } from "../../lib/server/login-link";
import { createRateLimiter } from "../../lib/server/rate-limit";
import { siteOrigin } from "../../lib/server/site-origin";
import {
	EMAIL_PATTERN,
	jsonResponse,
	readJsonBody,
	readString,
} from "../../lib/server/http";

export const prerender = false;

/** Five requests per address per ten minutes. */
const limiter = createRateLimiter(5, 10 * 60 * 1000);

/** Always the same answer, so the endpoint cannot enumerate accounts. */
const GENERIC = { ok: true };

export const POST: APIRoute = async ({ request, url, clientAddress }) => {
	if (!limiter.attempt(clientAddress ?? "unknown")) return jsonResponse(GENERIC);

	const body = await readJsonBody(request);
	const email = readString(body, "email").toLowerCase();
	if (!EMAIL_PATTERN.test(email)) return jsonResponse(GENERIC);

	const { title } = await getSiteSettings();

	await sendLoginLink({
		email,
		origin: siteOrigin(url),
		siteName: title ?? "Blog",
		next: safeNext(readString(body, "next")),
	}).catch((error) => {
		console.error("[login] failed to send sign-in link:", error);
	});

	return jsonResponse(GENERIC);
};
