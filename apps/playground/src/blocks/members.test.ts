import { describe, expect, test } from "bun:test";
import { filterMembers, initials, MEMBERS, roleCounts } from "./members";

describe("initials", () => {
	test("takes the first and last name", () => {
		expect(initials("Ada Lovelace")).toBe("AL");
		expect(initials("Mary Jane Watson")).toBe("MW");
	});
	test("handles one name", () => expect(initials("Cher")).toBe("C"));
});

describe("filterMembers", () => {
	test("returns everyone for an empty query and role all", () => {
		expect(filterMembers(MEMBERS, "", "all")).toHaveLength(MEMBERS.length);
	});
	test("matches name or email, case-insensitively", () => {
		const hits = filterMembers(MEMBERS, "ADA", "all");
		expect(hits.length).toBeGreaterThan(0);
		for (const member of hits) {
			expect(`${member.name} ${member.email}`.toLowerCase()).toContain("ada");
		}
	});
	test("narrows by role", () => {
		for (const member of filterMembers(MEMBERS, "", "admin")) expect(member.role).toBe("admin");
	});
	test("a query with no match is empty", () => {
		expect(filterMembers(MEMBERS, "zzzz", "all")).toEqual([]);
	});
});

describe("roleCounts", () => {
	test("all is the total and the roles sum to it", () => {
		const counts = roleCounts(MEMBERS);
		expect(counts.all).toBe(MEMBERS.length);
		expect(counts.admin + counts.editor + counts.viewer).toBe(MEMBERS.length);
	});
});
