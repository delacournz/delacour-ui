import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../commands/doctor";
import type { ResolvedConfig } from "../config/resolve";
import { readLock } from "../lock/lock";
import { isTest } from "../registry/classify";
import { detectTestRunner, type RunnerManifest, type TestRunner, testRunnerPackages } from "../registry/test-runner";
import type { ProjectInfo } from "./detect";
import { parseJsonc } from "./jsonc";

/**
 * Whether the runner copied tests were written for can actually run them.
 *
 * `add --tests` rewrites a suite's import for Jest or Vitest and installs what
 * the suite imports, but it does not write a runner's config: that file is the
 * project's, and most projects already have one. So everything the runner needs
 * from that config is checked instead — by `doctor`, and by `add --tests` right
 * after it copies. Each problem found here was a suite that failed to load in a
 * real app, not a guess.
 */

export type TestSetup = {
	/** What the copied tests were written for — `config.testRunner`. */
	runner: TestRunner;
	/** What the `test` script and dependencies say the project runs, or `null` when they say nothing. */
	scripted: TestRunner | null;
	/** How many copied test files the lock records. */
	copiedTests: number;
	/** Every dependency the app and the config's package declare. */
	dependencies: Record<string, string>;
	/** The Jest config's text — a `jest.config.*` file, or `package.json`'s `jest` key — or `null`. */
	jestConfig: string | null;
	/** The text of `vitest.config.*`, else `vite.config.*`, or `null`. */
	vitestConfig: string | null;
	/** What the tests' `tsconfig.json` extends, or `null`. */
	tsconfigExtends: string | null;
	/** The import prefix of each alias the components are written with — `@/` for `@/components/ui`. */
	aliasPrefixes: string[];
};

/** Expo's base config, which SDK 58's `exports` map hides from Vite's tsconfig loader. */
const EXPO_TSCONFIG = "expo/tsconfig.base";

export function checkTestRunner(setup: TestSetup): Check {
	const name = "Test runner";
	if (setup.copiedTests === 0) return { name, status: "skip", detail: "no copied tests" };

	const problems: Problem[] = [...missingPackages(setup), ...mismatchedScript(setup), ...runnerProblems(setup)];
	const count = `${setup.copiedTests} copied test${setup.copiedTests === 1 ? "" : "s"}`;
	if (problems.length === 0) return { name, status: "pass", detail: `${count} set up for ${setup.runner}` };

	return {
		name,
		status: "warn",
		detail: `${count} for ${setup.runner}, but ${problems.map((problem) => problem.detail).join("; ")}`,
		fix: problems.map((problem) => problem.fix).join(" "),
	};
}

type Problem = { detail: string; fix: string };

function missingPackages(setup: TestSetup): Problem[] {
	const needed = [...(setup.runner === "jest" ? ["jest"] : []), ...testRunnerPackages(setup.runner)];
	const missing = needed.filter((name) => !(name in setup.dependencies));
	if (missing.length === 0) return [];

	return [
		{
			detail: `${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not installed`,
			fix: `Install ${missing.map((name) => `\`${name}\``).join(", ")} as dev dependencies.`,
		},
	];
}

function mismatchedScript(setup: TestSetup): Problem[] {
	if (setup.scripted === null || setup.scripted === setup.runner) return [];

	return [
		{
			detail: `the project runs ${setup.scripted}`,
			fix: `Set \`tests.runner\` to "${setup.scripted}" in native-components.json and run \`update --tests\` to rewrite them, or point the \`test\` script at ${setup.runner}.`,
		},
	];
}

function runnerProblems(setup: TestSetup): Problem[] {
	switch (setup.runner) {
		case "bun":
			return [];
		case "jest":
			return jestProblems(setup);
		case "vitest":
			return vitestProblems(setup);
	}
}

/**
 * Bare Jest compiles neither TypeScript nor React Native, and `jest-expo` is
 * the preset that does both — and resolves the `tsconfig` aliases the copies
 * import through. Any other preset has to map them itself.
 */
function jestProblems(setup: TestSetup): Problem[] {
	if (setup.jestConfig === null) {
		return [
			{
				detail: "there is no Jest config",
				fix: 'Add `"jest": { "preset": "jest-expo" }` to package.json, beside `jest-expo` installed at the app\'s SDK.',
			},
		];
	}

	if (setup.jestConfig.includes("jest-expo")) return [];

	const unmapped = setup.aliasPrefixes.filter(
		(prefix) => !(setup.jestConfig?.includes("moduleNameMapper") && setup.jestConfig.includes(trimSlash(prefix)))
	);
	if (unmapped.length === 0) return [];

	return [
		{
			detail: `Jest does not resolve ${unmapped.join(", ")}`,
			fix: `Use the \`jest-expo\` preset, or map ${unmapped.map((prefix) => `\`${prefix}\``).join(", ")} in \`moduleNameMapper\`.`,
		},
	];
}

/**
 * Vitest reads no `tsconfig` paths, so an alias needs its own entry or the
 * `vite-tsconfig-paths` plugin. And Vite's own tsconfig loader cannot follow
 * `extends: "expo/tsconfig.base"` on SDK 58, which fails every suite before one
 * runs; `esbuild.tsconfigRaw` stops it reading `tsconfig.json` at all.
 */
function vitestProblems(setup: TestSetup): Problem[] {
	const config = setup.vitestConfig ?? "";
	const problems: Problem[] = [];

	const aliased = config.includes("vite-tsconfig-paths") || config.includes("tsconfigPaths");
	const unmapped = aliased ? [] : setup.aliasPrefixes.filter((prefix) => !quotes(config, trimSlash(prefix)));
	if (unmapped.length > 0) {
		problems.push({
			detail: `Vitest does not resolve ${unmapped.join(", ")}`,
			fix: `Map ${unmapped.map((prefix) => `\`${prefix}\``).join(", ")} in \`resolve.alias\` in vitest.config.ts.`,
		});
	}

	if (setup.tsconfigExtends === EXPO_TSCONFIG && !config.includes("tsconfigRaw")) {
		problems.push({
			detail: `Vite cannot follow tsconfig.json's extends of ${EXPO_TSCONFIG}`,
			fix: 'Set `esbuild: { tsconfigRaw: "{}" }` in vitest.config.ts.',
		});
	}

	return problems;
}

function trimSlash(prefix: string): string {
	return prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
}

/** Whether `text` holds `name`, or `name/`, as a whole quoted string. */
function quotes(text: string, name: string): boolean {
	return ['"', "'", "`"].some((quote) => text.includes(`${quote}${name}${quote}`) || text.includes(`${quote}${name}/`));
}

const JEST_CONFIG_FILES = [
	"jest.config.js",
	"jest.config.ts",
	"jest.config.cjs",
	"jest.config.mjs",
	"jest.config.json",
];

const VITEST_CONFIG_FILES = [
	"vitest.config.ts",
	"vitest.config.mts",
	"vitest.config.js",
	"vitest.config.mjs",
	"vitest.config.cjs",
	"vite.config.ts",
	"vite.config.mts",
	"vite.config.js",
	"vite.config.mjs",
];

type PackageManifest = RunnerManifest & { name?: string };

/** Reads what `checkTestRunner` and `checkJestTransform` need, from the config's package and then the app. */
export async function readTestSetup(config: ResolvedConfig, project: ProjectInfo): Promise<TestSetup> {
	const roots = [...new Set([config.root, config.app.resolved.root])];
	const manifests = await Promise.all(roots.map((root) => readJson<PackageManifest>(join(root, "package.json"))));
	const dependencies: Record<string, string> = Object.assign(
		{},
		project.packageJson?.dependencies,
		project.packageJson?.devDependencies,
		...manifests.flatMap((manifest) => [manifest?.dependencies, manifest?.devDependencies])
	);

	return {
		runner: config.testRunner,
		scripted: manifests.map((manifest) => (manifest ? detectTestRunner(manifest) : null)).find(Boolean) ?? null,
		copiedTests: await countCopiedTests(config.root),
		dependencies,
		jestConfig: await readJestConfig(roots, manifests),
		vitestConfig: await readFirst(roots, VITEST_CONFIG_FILES),
		tsconfigExtends: await readTsconfigExtends(roots),
		aliasPrefixes: aliasPrefixes(config),
	};
}

function aliasPrefixes(config: ResolvedConfig): string[] {
	const prefixes = Object.values(config.aliases).flatMap((alias) => alias?.match(/^[^/]+\//)?.[0] ?? []);
	return [...new Set(prefixes)];
}

async function countCopiedTests(root: string): Promise<number> {
	try {
		const lock = await readLock(root);
		return Object.values(lock.items)
			.flatMap((item) => Object.keys(item.files))
			.filter(isTest).length;
	} catch {
		return 0;
	}
}

async function readJestConfig(
	roots: readonly string[],
	manifests: readonly (PackageManifest | null)[]
): Promise<string | null> {
	for (const [index, root] of roots.entries()) {
		const file = await readFirst([root], JEST_CONFIG_FILES);
		if (file !== null) return file;

		const inline = manifests[index]?.jest;
		if (inline !== undefined) return JSON.stringify(inline);
	}

	return null;
}

async function readFirst(roots: readonly string[], names: readonly string[]): Promise<string | null> {
	for (const root of roots) {
		for (const name of names) {
			const path = join(root, name);
			if (existsSync(path)) return readFile(path, "utf-8");
		}
	}
	return null;
}

async function readTsconfigExtends(roots: readonly string[]): Promise<string | null> {
	for (const root of roots) {
		const text = await readFile(join(root, "tsconfig.json"), "utf-8").catch(() => null);
		if (text === null) continue;
		try {
			const { extends: base } = parseJsonc<{ extends?: unknown }>(text);
			return typeof base === "string" ? base : null;
		} catch {
			return null;
		}
	}
	return null;
}

async function readJson<T>(path: string): Promise<T | null> {
	try {
		return JSON.parse(await readFile(path, "utf-8")) as T;
	} catch {
		return null;
	}
}
