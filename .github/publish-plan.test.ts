import { describe, expect, test } from "bun:test";
import {
	findPackageDirs,
	lastJsonObject,
	type PublishRelease,
	parsePublishPlan,
	workspacePatterns,
} from "./publish-plan";

const charts: PublishRelease = {
	kind: "publish",
	name: "@delacour/react-native-charts",
	version: "0.1.0-alpha.2",
	access: "public",
	tag: "latest",
};

describe("parsePublishPlan", () => {
	test("accepts the shape `changeset publish-plan --output` writes", () => {
		const plan = parsePublishPlan({
			version: 1,
			plan: [[charts], [{ kind: "tag-only", name: "delacour", version: "0.1.0-alpha.1" }]],
		});
		expect(plan).toHaveLength(2);
		expect(plan[0]?.[0]?.kind).toBe("publish");
		expect(plan[1]?.[0]?.kind).toBe("tag-only");
	});

	test("rejects an unknown version", () => {
		expect(() => parsePublishPlan({ version: 2, plan: [] })).toThrow(/version/);
	});

	test("rejects a release with an unknown kind", () => {
		expect(() => parsePublishPlan({ version: 1, plan: [[{ ...charts, kind: "deploy" }]] })).toThrow(/chunk 0/);
	});
});

describe("lastJsonObject", () => {
	test("skips npm notices before the JSON", () => {
		const stdout = 'npm notice Staging to https://registry.npmjs.org/\n{"a":{"stageId":"x"}}\n';
		expect(lastJsonObject(stdout)).toEqual({ a: { stageId: "x" } });
	});

	test("returns null with no object", () => {
		expect(lastJsonObject("npm notice nothing here")).toBeNull();
	});
});

describe("workspacePatterns", () => {
	test("reads the object form Bun uses for a catalog", () => {
		expect(workspacePatterns({ workspaces: { packages: ["apps/*", "packages/*"], catalog: {} } })).toEqual([
			"apps/*",
			"packages/*",
		]);
	});

	test("reads the array form", () => {
		expect(workspacePatterns({ workspaces: ["packages/*"] })).toEqual(["packages/*"]);
	});
});

describe("findPackageDirs", () => {
	test("maps every workspace package to its directory", async () => {
		const dirs = await findPackageDirs(new URL("..", import.meta.url).pathname);
		expect(dirs.get("delacour")).toEndWith("/packages/cli");
		expect(dirs.get("@delacour/react-native-charts")).toEndWith("/packages/react-native-charts");
		expect(dirs.get("@delacour/react-native-ui")).toEndWith("/packages/react-native-ui");
	});
});
