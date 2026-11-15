import { useEffect, useState } from "react";
import { GROUPS, type GroupId } from "../../lib/groups";

/**
 * Admin page for member groups.
 *
 * Mounted by EmDash at `/_emdash/admin/plugins/member-groups/members`; the
 * declarations live in `admin.tsx` next to the plugin definition. It talks to
 * `/api/admin/member-groups`, which is admin-guarded server-side.
 */

interface Member {
	id: string;
	email: string;
	name: string | null;
	role: number;
	groups: GroupId[];
}

const ENDPOINT = "/api/admin/member-groups";

export function MembersPage() {
	const [members, setMembers] = useState<Member[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState<string | null>(null);

	useEffect(() => {
		fetch(ENDPOINT)
			.then(async (response) => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const body = (await response.json()) as { members: Member[] };
				setMembers(body.members);
			})
			.catch(() => setError("Could not load members."));
	}, []);

	async function save(member: Member, groups: GroupId[]) {
		setSaving(member.id);
		setError(null);
		try {
			const response = await fetch(ENDPOINT, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ userId: member.id, groups }),
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			setMembers((current) =>
				current?.map((entry) =>
					entry.id === member.id ? { ...entry, groups } : entry,
				) ?? null,
			);
		} catch {
			setError("Saving failed.");
		} finally {
			setSaving(null);
		}
	}

	function toggle(member: Member, group: GroupId) {
		const next = member.groups.includes(group)
			? member.groups.filter((entry) => entry !== group)
			: [...member.groups, group];
		void save(member, next);
	}

	if (!members) {
		return <p>{error ?? "Loading…"}</p>;
	}

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
				<ul style={{ display: "grid", gap: "0.75rem", listStyle: "none", margin: 0, padding: 0 }}>
					{members.map((member) => (
						<li
							key={member.id}
							style={{
								border: "1px solid rgba(127,127,127,0.25)",
								borderRadius: "0.75rem",
								padding: "1rem",
							}}
						>
							<div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
								<div>
									<strong>{member.name ?? member.email.split("@")[0]}</strong>
									<div style={{ fontSize: "0.8125rem", opacity: 0.7 }}>{member.email}</div>
								</div>
								<span style={{ fontSize: "0.8125rem", opacity: 0.7 }}>
									{member.role >= 50 ? "Admin" : "Member"}
								</span>
							</div>

							<div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", marginTop: "0.75rem" }}>
								{GROUPS.map((group) => (
									<label
										key={group.id}
										style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.875rem" }}
									>
										<input
											type="checkbox"
											checked={member.groups.includes(group.id)}
											disabled={saving === member.id}
											onChange={() => toggle(member, group.id)}
										/>
										<span>{group.label}</span>
									</label>
								))}
							</div>
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
