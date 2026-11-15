import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Ends the session for readers and staff alike. EmDash keeps the signed-in
 * user in the Astro session, so destroying it is all that is needed; the
 * admin panel redirects to its own login on the next request.
 */
export const POST: APIRoute = async ({ session, redirect }) => {
	session?.destroy();
	return redirect("/", 303);
};
