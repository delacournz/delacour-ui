import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { isTest } from "../../src/registry/classify";
import type { TestRunner } from "../../src/registry/test-runner";
import { type Reporter, run, type Workspace } from "./harness";

/**
 * `--tests <runner>`: the copied suites, run by the runner a consumer would.
 *
 * The unit tests prove `add --tests` writes `@jest/globals` or `vitest` where
 * `bun:test` was. They cannot prove the suites then pass: Jest refusing a
 * message passed to `expect`, and keeping the machine's zone when a suite sets
 * `TZ`, both shipped green under Bun and surfaced only when Jest ran. So this
 * sets a project up on the runner — the way its own docs say to — copies
 * everything with its tests, and runs them.
 */

export type RunnerSetup = {
	scripts: { test: string };
	devDependencies: Record<string, string>;
	jest?: unknown;
};

/**
 * What a project on `runner` carries in its `package.json`.
 *
 * Jest's preset follows the app's SDK, and its `transformIgnorePatterns` is
 * jest-expo's own with the engines added — the setting the docs and `doctor`
 * both ask for. Vitest gets a `vitest.config.ts` (see `vitestConfig`).
 */
export function runnerManifest(runner: TestRunner, expoSdk: string): RunnerSetup {
	if (runner === "bun") return { scripts: { test: "bun test" }, devDependencies: {} };

	if (runner === "vitest") {
		return { scripts: { test: "vitest run" }, devDependencies: { vitest: "^3.2.4" } };
	}

	const major = expoSdk.replace(/^[~^]/, "").split(".")[0];
	return {
		scripts: { test: "jest" },
		devDependencies: { jest: "^30.0.0", "jest-expo": `~${major}.0.0` },
		jest: {
			preset: "jest-expo",
			transformIgnorePatterns: [
				"node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@delacour/.*|d3-.*|internmap)",
			],
		},
	};
}

/**
 * What a Vitest project on this SDK needs in `vitest.config.ts`.
 *
 * Vitest reads no `tsconfig` paths, so a project importing through `@/` maps
 * them itself — written from the project's own `paths`. And SDK 58's `expo`
 * has an `exports` map without `./tsconfig.base`, so Vite's own tsconfig
 * loader cannot follow `extends: "expo/tsconfig.base"` and fails every suite;
 * a `tsconfigRaw` stops it reading `tsconfig.json` at all.
 */
export function vitestConfig(paths: Record<string, readonly string[]>): string {
	const aliases = Object.entries(paths)
		.filter(([key, targets]) => key.endsWith("/*") && targets[0]?.endsWith("/*"))
		.map(([key, targets]) => {
			const from = key.slice(0, -1);
			const to = (targets[0] as string).slice(0, -2);
			return `\t\t\t{ find: ${JSON.stringify(from)}, replacement: \`\${resolve(import.meta.dirname, ${JSON.stringify(to)})}/\` },`;
		});

	return [
		'import { resolve } from "node:path";',
		'import { defineConfig } from "vitest/config";',
		"",
		"export default defineConfig({",
		'\tesbuild: { tsconfigRaw: "{}" },',
		"\tresolve: {",
		"\t\talias: [",
		...aliases,
		"\t\t],",
		"\t},",
		"});",
		"",
	].join("\n");
}

/** Puts the runner into the package the tests land in, before `add` reads it to pick one. */
export async function prepareTestRunner(
	workspace: Workspace,
	runner: TestRunner,
	options: { expoSdk: string; install: boolean; reporter: Reporter }
): Promise<void> {
	const path = join(workspace.configRoot, "package.json");
	const manifest = JSON.parse(await readFile(path, "utf-8"));
	const setup = runnerManifest(runner, options.expoSdk);

	manifest.scripts = { ...manifest.scripts, ...setup.scripts };
	if (setup.jest) manifest.jest = setup.jest;
	await writeFile(path, `${JSON.stringify(manifest, null, "\t")}\n`, "utf-8");

	const configPath = join(workspace.configRoot, "vitest.config.ts");
	if (runner === "vitest") {
		const tsconfig = JSON.parse(await readFile(join(workspace.configRoot, "tsconfig.json"), "utf-8").catch(() => "{}"));
		await writeFile(configPath, vitestConfig(tsconfig.compilerOptions?.paths ?? {}), "utf-8");
	} else await rm(configPath, { force: true });

	const packages = Object.entries(setup.devDependencies).map(([name, range]) => `${name}@${range}`);
	if (options.install && packages.length > 0) {
		await run("bun", ["add", "--dev", ...packages], {
			cwd: workspace.configRoot,
			reporter: options.reporter,
			label: `bun add ${runner}`,
		});
	}

	options.reporter.pass(
		`${workspace.configRoot === workspace.appRoot ? "the app" : "the package"} tests with ${runner}`
	);
}

export type TestRun = {
	files: number;
	tests: number;
	failed: number;
	/** One line per failure, to print. */
	failures: string[];
};

type JsonReport = {
	numTotalTestSuites: number;
	numFailedTestSuites: number;
	numTotalTests: number;
	numFailedTests: number;
	testResults: { name: string; status: string; message: string }[];
};

/** Jest's `--json` and Vitest's `json` reporter write the same top-level shape. */
export function parseJsonReport(text: string): TestRun {
	const report = JSON.parse(text) as JsonReport;
	const failedFiles = report.testResults.filter((result) => result.status !== "passed");

	return {
		// One result per file in both. Vitest's `numTotalTestSuites` counts every `describe` as well.
		files: report.testResults.length,
		tests: report.numTotalTests,
		// A suite that never loaded has no failed test, and is the failure that matters most.
		failed: Math.max(report.numFailedTests, report.numFailedTestSuites),
		failures: failedFiles.map((result) => `${result.name}: ${result.message.split("\n")[0] ?? ""}`),
	};
}

/** `bun test` has no JSON reporter; its closing summary is stable, and a missing one is an error. */
export function parseBunSummary(output: string): TestRun {
	const summary = output.match(/Ran (\d+) tests? across (\d+) files?/);
	const failed = output.match(/^\s*(\d+) fail$/m);
	if (!summary || !failed) throw new Error(`bun test printed no summary:\n${output.slice(-400)}`);

	return {
		files: Number(summary[2]),
		tests: Number(summary[1]),
		failed: Number(failed[1]),
		failures: output.split("\n").filter((line) => line.startsWith("(fail)")),
	};
}

/** Runs the copied suites under `runner`, from the package they were copied into. */
export async function runCopiedTests(cwd: string, runner: TestRunner, reporter: Reporter): Promise<TestRun> {
	if (runner === "bun") {
		const output = await run("bun", ["test"], { cwd, reporter, label: "bun test", allowFailure: true });
		return parseBunSummary(output);
	}

	const outputFile = join(cwd, ".verify-test-report.json");
	const args =
		runner === "jest"
			? ["jest", "--json", `--outputFile=${outputFile}`]
			: ["vitest", "run", "--reporter=json", `--outputFile=${outputFile}`];

	await rm(outputFile, { force: true });
	const output = await run("bun", ["x", ...args], { cwd, reporter, label: runner, allowFailure: true });

	try {
		return parseJsonReport(await readFile(outputFile, "utf-8"));
	} catch {
		throw new Error(`${runner} wrote no report:\n${output.slice(-400)}`);
	}
}

/** The suites the lock says were copied — what the runner has to have found and run. */
export async function copiedSuites(configRoot: string): Promise<string[]> {
	const lock = JSON.parse(await readFile(join(configRoot, "native-components.lock.json"), "utf-8")) as {
		items: Record<string, { files: Record<string, unknown> }>;
	};

	return Object.values(lock.items)
		.flatMap((item) => Object.keys(item.files))
		.filter((key) => isTest(key) && key.endsWith(".test.ts"))
		.sort();
}
