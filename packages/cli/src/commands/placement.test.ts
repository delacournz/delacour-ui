import { describe, expect, test } from "bun:test";
import type { ProjectInfo } from "../project/detect";
import { defaultPlacement } from "./init";

/**
 * The branches that decide where components land.
 *
 * Untested until now, because the decision was tangled up with the prompting —
 * which is how "running inside a package never asks" went unnoticed.
 */
function project(overrides: Partial<ProjectInfo>): ProjectInfo {
	return {
		cwd: "/repo",
		packageRoot: null,
		packageJson: null,
		workspaceRoot: null,
		packageManager: "bun",
		appRoot: null,
		expoVersion: null,
		reactNativeVersion: null,
		hasUniwind: false,
		hasTailwind: false,
		tsconfigPath: null,
		pathMappings: [],
		...overrides,
	};
}

describe("defaultPlacement", () => {
	test("a plain Expo app: the app, with no package", () => {
		const result = defaultPlacement(project({ appRoot: "/app", packageRoot: "/app" }), "/app");

		expect(result).toEqual({ root: "/app" });
	});

	test("inside a package that is not the app: that package", () => {
		const result = defaultPlacement(
			project({ appRoot: "/repo/apps/mobile", packageRoot: "/repo/packages/ui", workspaceRoot: "/repo" }),
			"/repo/packages/ui"
		);

		expect(result.root).toBe("/repo/packages/ui");
	});

	test("from the workspace root: the app, since that is the only concrete answer", () => {
		const result = defaultPlacement(
			project({ appRoot: "/repo/apps/mobile", packageRoot: "/repo", workspaceRoot: "/repo" }),
			"/repo"
		);

		expect(result.root).toBe("/repo/apps/mobile");
	});

	test("from inside the app of a workspace: the app", () => {
		const result = defaultPlacement(
			project({ appRoot: "/repo/apps/mobile", packageRoot: "/repo/apps/mobile", workspaceRoot: "/repo" }),
			"/repo/apps/mobile"
		);

		expect(result.root).toBe("/repo/apps/mobile");
	});

	test("no app found anywhere: the current package", () => {
		const result = defaultPlacement(project({ packageRoot: "/somewhere" }), "/somewhere");

		expect(result.root).toBe("/somewhere");
	});

	test("nothing found at all: the working directory", () => {
		expect(defaultPlacement(project({}), "/bare").root).toBe("/bare");
	});

	/** The default never names a package — that only comes from a prompt or a flag. */
	test("never invents a package name", () => {
		const result = defaultPlacement(
			project({ appRoot: "/repo/apps/mobile", packageRoot: "/repo/packages/ui", workspaceRoot: "/repo" }),
			"/repo/packages/ui"
		);

		expect(result.packageName).toBeUndefined();
	});
});
