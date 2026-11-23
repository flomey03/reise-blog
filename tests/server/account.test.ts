import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("emdash/middleware", () => ({
	withEmDashRuntime: vi.fn(),
}));

import { withEmDashRuntime } from "emdash/middleware";
import { ensureAccountForEmail } from "../../src/lib/server/account";
import { MEMBER_ROLE } from "../../src/plugins/member-groups/roles";

interface AllowedDomain {
	domain: string;
	default_role: number;
	enabled: number;
}

interface FakeDbOptions {
	existingUser?: boolean;
	allowedDomains?: AllowedDomain[];
}

function createFakeDb({
	existingUser = false,
	allowedDomains = [],
}: FakeDbOptions = {}) {
	const inserts: Array<Record<string, unknown>> = [];

	const db = {
		selectFrom(table: string) {
			if (table === "users") {
				return {
					select: () => ({
						where: () => ({
							executeTakeFirst: async () =>
								existingUser ? { id: "existing-user" } : undefined,
						}),
					}),
				};
			}

			if (table === "allowed_domains") {
				return {
					select: () => ({
						where: (column: string, operator: string, value: unknown) => ({
							execute: async () =>
								column === "enabled" && operator === "="
									? allowedDomains.filter((entry) => entry.enabled === value)
									: allowedDomains,
						}),
					}),
				};
			}

			throw new Error(`Unexpected table: ${table}`);
		},
		insertInto(table: string) {
			if (table !== "users") throw new Error(`Unexpected insert table: ${table}`);
			return {
				values: (values: Record<string, unknown>) => {
					inserts.push(values);
					return { execute: async () => undefined };
				},
			};
		},
	};

	return { db, inserts };
}

function mockRuntime(options: FakeDbOptions = {}) {
	const fake = createFakeDb(options);
	vi.mocked(withEmDashRuntime).mockReset();
	vi.mocked(withEmDashRuntime).mockImplementation(async (callback) => {
		const run = callback as (context: { db: unknown }) => Promise<unknown>;
		return (await run({ db: fake.db })) as never;
	});
	return fake;
}

beforeEach(() => {
	vi.mocked(withEmDashRuntime).mockReset();
});

describe("ensureAccountForEmail", () => {
	it("rejects an invalid address without touching the database", async () => {
		const fake = mockRuntime();

		expect(await ensureAccountForEmail("keine-email")).toBe(false);
		expect(fake.inserts).toHaveLength(0);
	});

	it("returns true for an existing account without creating another one", async () => {
		const fake = mockRuntime({
			existingUser: true,
			allowedDomains: [{ domain: "*", default_role: 10, enabled: 1 }],
		});

		expect(await ensureAccountForEmail("alt@example.de")).toBe(true);
		expect(fake.inserts).toHaveLength(0);
	});

	it("creates an account for an exact allowed domain", async () => {
		const fake = mockRuntime({
			allowedDomains: [{ domain: "example.de", default_role: 20, enabled: 1 }],
		});

		expect(await ensureAccountForEmail("neu@example.de")).toBe(true);
		expect(fake.inserts).toHaveLength(1);
		expect(fake.inserts[0]?.email).toBe("neu@example.de");
		expect(fake.inserts[0]?.role).toBe(20);
	});

	it("accepts suffix wildcards for apex and subdomains", async () => {
		const fake = mockRuntime({
			allowedDomains: [{ domain: "*.de", default_role: 10, enabled: 1 }],
		});

		expect(await ensureAccountForEmail("a@example.de")).toBe(true);
		expect(await ensureAccountForEmail("b@sub.example.de")).toBe(true);
		expect(fake.inserts.map((values) => values.email)).toEqual([
			"a@example.de",
			"b@sub.example.de",
		]);
	});

	it("ignores disabled domain entries", async () => {
		const fake = mockRuntime({
			allowedDomains: [{ domain: "example.de", default_role: 10, enabled: 0 }],
		});

		expect(await ensureAccountForEmail("neu@example.de")).toBe(false);
		expect(fake.inserts).toHaveLength(0);
	});

	it("lets exact domains beat suffix wildcards and the global wildcard", async () => {
		const fake = mockRuntime({
			allowedDomains: [
				{ domain: "*", default_role: 10, enabled: 1 },
				{ domain: "*.de", default_role: 15, enabled: 1 },
				{ domain: "example.de", default_role: 20, enabled: 1 },
			],
		});

		await ensureAccountForEmail("neu@example.de");

		expect(fake.inserts[0]?.role).toBe(20);
	});

	it("never grants a role below MEMBER_ROLE", async () => {
		const fake = mockRuntime({
			allowedDomains: [{ domain: "example.de", default_role: 1, enabled: 1 }],
		});

		await ensureAccountForEmail("neu@example.de");

		expect(fake.inserts[0]?.role).toBe(MEMBER_ROLE);
	});

	it("gives new members a display name from the email local part", async () => {
		const fake = mockRuntime({
			allowedDomains: [{ domain: "*", default_role: 10, enabled: 1 }],
		});

		await ensureAccountForEmail("hallasdf@gmail.com");

		expect(fake.inserts[0]?.name).toBe("hallasdf");
	});
});
