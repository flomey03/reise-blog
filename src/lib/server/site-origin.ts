/**
 * Canonical public origin for links and SEO URLs.
 *
 * In production the site runs behind a reverse proxy and the request URL can
 * carry the internal address (e.g. `http://localhost:4321`). `EMDASH_SITE_URL`
 * is the public origin configured for the deployment; fall back to the request
 * origin so local development keeps working without configuration.
 */
export function siteOrigin(requestUrl: URL): string {
	const configured =
		process.env.EMDASH_SITE_URL?.trim() || process.env.SITE_URL?.trim();
	if (!configured) return requestUrl.origin;

	try {
		return new URL(configured).origin;
	} catch {
		console.warn(`[site] ignoring invalid site URL: ${configured}`);
		return requestUrl.origin;
	}
}
