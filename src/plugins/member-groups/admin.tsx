import { useEffect, useState } from "react";

/**
 * Admin page for member groups.
 *
 * Mounted by EmDash at `/_emdash/admin/plugins/member-groups/members` and backed
 * by the plugin's own `members` route, which is admin-guarded server-side.
 */

interface Member {
	id: string;
	email: string;
	name: string | null;
	role: number;
	groups: string[];
}

interface GroupOption {
	slug: string;
	label: string;
}

interface MembersData {
	members: Member[];
	groups: GroupOption[];
}

const ENDPOINT = "/_emdash/api/plugins/member-groups/members";

async function request(body?: { userId: string; groups: string[] }) {
	const response = await fetch(ENDPOINT, {
		method: body ? "POST" : "GET",
		headers: {
			// Private plugin routes require this CSRF header on every method.
			"X-EmDash-Request": "1",
			...(body ? { "content-type": "application/json" } : {}),
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	// Private plugin routes answer with the `{ success, data }` envelope.
	const payload = (await response.json()) as { data: unknown };
	return payload.data;
}

export function MembersPage() {
	const [data, setData] = useState<MembersData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState<string | null>(null);

	useEffect(() => {
		request()
			.then((result) => setData(result as MembersData))
			.catch(() => setError("Could not load members."));
	}, []);

	async function save(member: Member, groups: string[]) {
		setSaving(member.id);
		setError(null);
		try {
			await request({ userId: member.id, groups });
			setData((current) =>
				current
					? {
							...current,
							members: current.members.map((entry) =>
								entry.id === member.id ? { ...entry, groups } : entry,
							),
						}
					: current,
			);
		} catch {
			setError("Saving failed.");
		} finally {
			setSaving(null);
		}
	}

	function toggle(member: Member, slug: string) {
		const next = member.groups.includes(slug)
			? member.groups.filter((entry) => entry !== slug)
			: [...member.groups, slug];
		void save(member, next);
	}

	if (!data) {
		return <p>{error ?? "Loading…"}</p>;
	}

	const { members, groups } = data;

	return (
		<div style={{ display: "grid", gap: "1rem", maxWidth: "44rem" }}>
			<div>
				<h2 style={{ margin: 0, fontSize: "1.125rem" }}>Members</h2>
				<p style={{ margin: "0.25rem 0 0", opacity: 0.7, fontSize: "0.875rem" }}>
					Groups decide which posts an account may read.
				</p>
			</div>

			{error && <p style={{ color: "crimson" }}>{error}</p>}

			{members.length === 0 ? (
				<p>No accounts yet.</p>
			) : (
				<ul
					style={{
						display: "grid",
						gap: "0.75rem",
						listStyle: "none",
						margin: 0,
						padding: 0,
					}}
				>
					{members.map((member) => (
						<li
							key={member.id}
							style={{
								border: "1px solid rgba(127,127,127,0.25)",
								borderRadius: "0.75rem",
								padding: "1rem",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									gap: "1rem",
								}}
							>
								<div>
									<strong>{member.name ?? member.email.split("@")[0]}</strong>
									<div style={{ fontSize: "0.8125rem", opacity: 0.7 }}>
										{member.email}
									</div>
								</div>
								<span style={{ fontSize: "0.8125rem", opacity: 0.7 }}>
									{member.role >= 50 ? "Admin" : "Member"}
								</span>
							</div>

							{groups.length === 0 ? (
								<p style={{ margin: "0.75rem 0 0", opacity: 0.7 }}>
									No member groups defined yet.
								</p>
							) : (
								<div
									style={{
										display: "flex",
										flexWrap: "wrap",
										gap: "0.5rem 1rem",
										marginTop: "0.75rem",
									}}
								>
									{groups.map((group) => (
										<label
											key={group.slug}
											style={{
												display: "flex",
												gap: "0.4rem",
												alignItems: "center",
												fontSize: "0.875rem",
											}}
										>
											<input
												type="checkbox"
												checked={member.groups.includes(group.slug)}
												disabled={saving === member.id}
												onChange={() => toggle(member, group.slug)}
											/>
											<span>{group.label}</span>
										</label>
									))}
								</div>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

/** EmDash mounts each entry under the page path declared in the plugin. */
export const pages = {
	"/members": MembersPage,
};
