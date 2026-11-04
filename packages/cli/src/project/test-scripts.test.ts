import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type ResolvedConfig, resolveConfig } from "../config/resolve";
import { configSchema } from "../config/schema";
import { ensureTestScripts, planScripts, TEST_SCRIPT_NAMES, testScripts } from "./test-scripts";

const DIRS = ["src/components/ui", "src/lib"];

describe("testScripts", () => {
	test("jest gets all three, the unit script ignoring render suites and the render script matching only them", () => {
		const scripts = testScripts("jest", DIRS);

		expect(Object.keys(scripts)).toEqual([...TEST_SCRIPT_NAMES]);
		expect(scripts["test:ui"]).toBe("jest src/components/ui src/lib");
		expect(scripts["test:ui:unit"]).toBe(
			'jest src/components/ui src/lib --testPathIgnorePatterns /node_modules/ "\\.render\\.test\\.tsx$"'
		);
		expect(scripts["test:ui:render"]).toBe('jest "(src/components/ui|src/lib)/.*\\.render\\.test\\.tsx$"');
	});

	test("the render script's path regex matches a copied render suite and nothing else", () => {
		const pattern = testScripts("jest", DIRS)["test:ui:render"]?.match(/"(.+)"/)?.[1] ?? "";
		const regex = new RegExp(pattern);

		expect(regex.test("/app/src/components/ui/button/button.render.test.tsx")).toBe(true);
		expect(regex.test("/app/src/components/ui/button/button.variants.test.ts")).toBe(false);
		expect(regex.test("/app/src/screens/home.render.test.tsx")).toBe(false);
	});

	test("escapes a directory's regex characters", () => {
		expect(testScripts("jest", ["src/ui.kit"])["test:ui:render"]).toBe(
			'jest "(src/ui\\.kit)/.*\\.render\\.test\\.tsx$"'
		);
	});

	test("bun and vitest get no render script — none of their render suites are copied", () => {
		expect(testScripts("bun", DIRS)).toEqual({
			"test:ui": "bun test ./src/components/ui ./src/lib",
			"test:ui:unit": "bun test ./src/components/ui ./src/lib",
		});
		expect(testScripts("vitest", DIRS)).toEqual({
			"test:ui": "vitest run src/components/ui src/lib",
			"test:ui:unit": "vitest run src/components/ui src/lib",
		});
	});
});

describe("planScripts", () => {
	test("adds only the keys the project lacks, and keeps the rest as they are", () => {
		const plan = planScripts({ "test:ui": "my own", build: "x" }, { "test:ui": "jest a", "test:ui:unit": "jest b" });

		expect(plan).toEqual({ add: { "test:ui:unit": "jest b" }, kept: ["test:ui"] });
	});

	test("with no scripts at all, adds every one", () => {
		expect(planScripts(undefined, { "test:ui": "a" })).toEqual({ add: { "test:ui": "a" }, kept: [] });
	});
});

describe("ensureTestScripts", () => {
	let root: string;

	beforeEach(async () => {
		root = await mkdtemp(join(tmpdir(), "delacour-test-scripts-"));
		await mkdir(join(root, "src/components/ui"), { recursive: true });
		await mkdir(join(root, "src/lib"), { recursive: true });
	});

	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	function configFor(runner: "bun" | "jest" | "vitest"): ResolvedConfig {
		const parsed = configSchema.parse({
			paths: {
				ui: "src/components/ui",
				lib: "src/lib",
				hooks: "src/hooks",
				styles: "src/styles",
				icons: "src/components/ui/icons",
			},
			aliases: {},
			app: { root: ".", css: "src/global.css", metroConfig: "metro.config.js", uniwindTypes: "uniwind-types.d.ts" },
			tests: { runner },
		});
		return resolveConfig(parsed, root, join(root, "native-components.json"));
	}

	async function manifest(): Promise<Record<string, unknown>> {
		return JSON.parse(await readFile(join(root, "package.json"), "utf-8"));
	}

	test("adds the scripts for the directories that exist, keeping the file's indent", async () => {
		await writeFile(
			join(root, "package.json"),
			`${JSON.stringify({ name: "app", scripts: { start: "expo" } }, null, 2)}\n`
		);

		const result = await ensureTestScripts(configFor("jest"));

		expect(result).toEqual({ status: "added", file: "package.json", scripts: [...TEST_SCRIPT_NAMES] });
		expect((await manifest()).scripts).toEqual({ start: "expo", ...testScripts("jest", DIRS) });
		expect(await readFile(join(root, "package.json"), "utf-8")).toStartWith('{\n  "name"');
	});

	test("a second run changes nothing", async () => {
		await writeFile(join(root, "package.json"), JSON.stringify({ name: "app" }));
		await ensureTestScripts(configFor("bun"));
		const before = await readFile(join(root, "package.json"), "utf-8");

		expect(await ensureTestScripts(configFor("bun"))).toEqual({ status: "unchanged", file: "package.json" });
		expect(await readFile(join(root, "package.json"), "utf-8")).toBe(before);
	});

	test("never overwrites a script the project already has", async () => {
		await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { "test:ui": "custom" } }));

		const result = await ensureTestScripts(configFor("vitest"));

		expect(result).toEqual({ status: "added", file: "package.json", scripts: ["test:ui:unit"] });
		expect((await manifest()).scripts).toMatchObject({ "test:ui": "custom" });
	});

	test("with no package.json, says so and writes nothing", async () => {
		expect((await ensureTestScripts(configFor("bun"))).status).toBe("manual");
	});
});
