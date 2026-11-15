/** Small helpers shared by the auth endpoints. */

export function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});
}

export async function readJsonBody(
	request: Request,
): Promise<Record<string, unknown> | null> {
	try {
		const parsed: unknown = await request.json();
		return parsed && typeof parsed === "object"
			? (parsed as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

export function readString(
	body: Record<string, unknown> | null,
	key: string,
): string {
	const value = body?.[key];
	return typeof value === "string" ? value.trim() : "";
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
