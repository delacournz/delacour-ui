import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { VERIFY_DIR, verifyPaths } from "./harness";

describe("verifyPaths", () => {
	test("keeps the app, the built CLI and the packed engines in .verify by default", () => {
		const paths = verifyPaths(undefined, "/anywhere");

		expect(paths.app).toBe(VERIFY_DIR);
		expect(paths.cli).toBe(`${VERIFY_DIR}.cli`);
		expect(paths.packages).toBe(`${VERIFY_DIR}.packages`);
	});

	test("resolves --dir from where the command ran, and keeps its build beside it", () => {
		const paths = verifyPaths(".verify/tests-jest", "/repo/packages/cli");

		expect(paths.app).toBe("/repo/packages/cli/.verify/tests-jest");
		expect(paths.cli).toBe("/repo/packages/cli/.verify/tests-jest.cli");
		expect(paths.packages).toBe("/repo/packages/cli/.verify/tests-jest.packages");
	});

	test("two directories share nothing a run writes, so they can run side by side", () => {
		const one = Object.values(verifyPaths(".verify/tests-bun", "/cli"));
		const two = Object.values(verifyPaths(".verify/tests-vitest", "/cli"));

		expect(one.filter((path) => two.includes(path))).toEqual([]);
		expect(one.every((path) => path.startsWith(join("/cli", ".verify")))).toBe(true);
	});
});
