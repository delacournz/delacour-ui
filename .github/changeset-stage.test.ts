import { describe, expect, test } from "bun:test";
import {
	findPackageDirs,
	formatSummary,
	lastJsonObject,
	type PublishRelease,
	parsePreState,
	parsePublishPlan,
	parseStageResult,
	resolveDistTag,
	workspacePatterns,
} from "./changeset-stage";

const charts: PublishRelease = {
	kind: "publish",
	name: "delacour-react-native-charts",
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

describe("resolveDistTag", () => {
	test("pre mode overrides the plan's `latest`", () => {
		expect(resolveDistTag(charts, { mode: "pre", tag: "alpha" })).toBe("alpha");
	});

	test("an exited pre mode falls back to the plan", () => {
		expect(resolveDistTag(charts, { mode: "exit", tag: "alpha" })).toBe("latest");
	});

	test("no pre.json falls back to the plan", () => {
		expect(resolveDistTag({ ...charts, tag: "next" }, null)).toBe("next");
	});
});

describe("parsePreState", () => {
	test("reads pre.json", () => {
		expect(parsePreState({ mode: "pre", tag: "alpha" })).toEqual({ mode: "pre", tag: "alpha" });
	});

	test("ignores anything else", () => {
		expect(parsePreState(null)).toBeNull();
		expect(parsePreState({ mode: "beta" })).toBeNull();
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

describe("parseStageResult", () => {
	const name = charts.name;

	test("reads the stageId keyed by package name", () => {
		const stdout = JSON.stringify({
			[name]: { id: `${name}@0.1.0-alpha.2`, stageId: "0b7a3f0e-2f1c-4d7a-9d1e-2c7f1d3e4a5b" },
		});
		expect(parseStageResult({ name, exitCode: 0, stdout, stderr: "" })).toEqual({
			result: "staged",
			stageId: "0b7a3f0e-2f1c-4d7a-9d1e-2c7f1d3e4a5b",
		});
	});

	test("a clean exit without a stageId is a failure, not a stage", () => {
		const outcome = parseStageResult({ name, exitCode: 0, stdout: "{}", stderr: "" });
		expect(outcome.result).toBe("failed");
	});

	test("reads npm's error object", () => {
		const stdout = JSON.stringify({
			error: {
				code: "E403",
				summary: "403 Forbidden - OIDC permission denied for this action",
				detail: "In most cases, you or one of your dependencies…",
			},
		});
		expect(parseStageResult({ name, exitCode: 1, stdout, stderr: "" })).toEqual({
			result: "failed",
			code: "E403",
			message:
				"403 Forbidden - OIDC permission denied for this action\nIn most cases, you or one of your dependencies…",
		});
	});

	test("a version already staged counts as success", () => {
		const stdout = JSON.stringify({ error: { code: "E409", summary: "This version has already been staged" } });
		expect(parseStageResult({ name, exitCode: 1, stdout, stderr: "" })).toEqual({ result: "already-staged" });
	});

	test("falls back to stderr when npm printed no JSON", () => {
		const outcome = parseStageResult({ name, exitCode: 1, stdout: "", stderr: "boom" });
		expect(outcome).toEqual({ result: "failed", code: undefined, message: "boom" });
	});
});

describe("formatSummary", () => {
	test("lists every package with its approve command", () => {
		const summary = formatSummary([
			{
				name: charts.name,
				version: charts.version,
				tag: "alpha",
				outcome: { result: "staged", stageId: "abc" },
			},
			{
				name: "delacour",
				version: "0.1.0-alpha.1",
				tag: "alpha",
				outcome: { result: "failed", code: "E403", message: "denied\nmore" },
			},
		]);
		expect(summary).toContain("npm stage approve abc");
		expect(summary).toContain("| delacour | 0.1.0-alpha.1 | alpha | **failed** E403 denied |");
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
		expect(dirs.get("delacour-react-native-charts")).toEndWith("/packages/charts");
		expect(dirs.get("delacour-react-native-ui")).toEndWith("/packages/native-ui");
	});
});
