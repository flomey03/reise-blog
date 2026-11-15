import { generateTokenWithHash } from "@emdash-cms/auth";
import { withEmDashRuntime } from "emdash/middleware";

/**
 * Sign-in links, issued by us instead of by the CMS.
 *
 * EmDash's own magic link sends readers through `/_emdash/admin/login`, which
 * is staff territory. We create the same kind of single-use token in
 * `auth_tokens` — so sessions stay EmDash sessions — but mail a link that
 * points at our own confirmation page.
 */

const TOKEN_TTL_MS = 15 * 60 * 1000;
const LANDING_PATH = "/login/confirm";

export interface LoginLinkInput {
	email: string;
	/** Absolute site origin, e.g. `https://example.com`. */
	origin: string;
	/** Site name used in the subject line. */
	siteName: string;
	/** Where to continue after sign-in. Must be a local path. */
	next?: string | null;
}

/**
 * Creates a token and mails the link. Returns `false` when the address has no
 * account — callers answer generically either way, so nobody can probe for
 * registered addresses.
 */
export async function sendLoginLink({
	email,
	origin,
	siteName,
	next,
}: LoginLinkInput): Promise<boolean> {
	return withEmDashRuntime(async ({ db, email: mailer }) => {
		if (!mailer) return false;

		const user = await db
			.selectFrom("users")
			.select(["id", "email"])
			.where("email", "=", email)
			.executeTakeFirst();
		if (!user) return false;

		const { token, hash } = generateTokenWithHash();
		await db
			.insertInto("auth_tokens")
			.values({
				hash,
				user_id: user.id,
				email: user.email,
				type: "magic_link",
				expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
			})
			.execute();

		const url = new URL(LANDING_PATH, origin);
		url.searchParams.set("token", token);
		const target = safeNext(next);
		if (target) url.searchParams.set("next", target);

		// Development convenience: the link also lands in the `pnpm dev` log,
		// so a local test needs no inbox. Never runs in a production build.
		if (import.meta.env.DEV) {
			console.log(
				`\n  [login] Anmelde-Link für ${user.email}\n  [login] ${url.href}\n`,
			);
		}

		await mailer.send(
			{
				to: user.email,
				subject: `Anmelden bei ${siteName}`,
				text: `Öffne diesen Link, um dich anzumelden:\n\n${url}\n\nDer Link ist 15 Minuten gültig und nur einmal verwendbar. Wenn du ihn nicht angefordert hast, ignoriere diese E-Mail.`,
				html: `<p>Öffne diesen Link, um dich anzumelden:</p><p><a href="${url}">Jetzt anmelden</a></p><p>Der Link ist 15 Minuten gültig und nur einmal verwendbar. Wenn du ihn nicht angefordert hast, ignoriere diese E-Mail.</p>`,
			},
			"system",
		);

		return true;
	});
}

/**
 * Only same-site paths are allowed as a post-login destination, so the link
 * cannot be turned into an open redirect.
 */
export function safeNext(value: string | null | undefined): string | null {
	if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
	return value;
}
