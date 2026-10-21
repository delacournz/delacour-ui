/**
 * The runner a project's copied tests are written for.
 *
 * The library's suites are Bun's, and the registry build holds every shipped one
 * to the API Bun, Jest and Vitest share — `describe` / `test` / `it` / `expect`
 * and the four hooks, a `node:*` read beside itself through
 * `import.meta.dirname`, and nothing else. So a suite moves between runners by
 * two substitutions and no parsing: the module the API is imported from, and,
 * for Jest, which cannot evaluate `import.meta` in CommonJS, `__dirname`.
 */

export const TEST_RUNNERS = ["bun", "jest", "vitest"] as const;

export type TestRunner = (typeof TEST_RUNNERS)[number];

/** Where each runner's shared API is imported from. */
const RUNNER_MODULE: Record<TestRunner, string> = {
	bun: "bun:test",
	jest: "@jest/globals",
	vitest: "vitest",
};

/**
 * What a project needs to typecheck and run its copied tests. `node:*` imports
 * need Node's types everywhere but Bun, whose own types carry them.
 */
const RUNNER_PACKAGES: Record<TestRunner, readonly string[]> = {
	bun: ["@types/bun"],
	jest: ["@jest/globals", "@types/node"],
	vitest: ["@types/node", "vitest"],
};

/** The package the registry records for `bun:test`, and that a project on another runner swaps out. */
export const BUN_TEST_TYPES = "@types/bun";

const BUN_TEST_IMPORT = /(from\s*)(["'])bun:test\2/g;

/** A copied test's text as `runner` runs it. */
export function adaptTest(content: string, runner: TestRunner): string {
	if (runner === "bun") return content;

	const imported = content.replace(BUN_TEST_IMPORT, (_match, from: string, quote: string) => {
		return `${from}${quote}${RUNNER_MODULE[runner]}${quote}`;
	});

	return runner === "jest" ? imported.replaceAll("import.meta.dirname", "__dirname") : imported;
}

export function testRunnerPackages(runner: TestRunner): string[] {
	return [...RUNNER_PACKAGES[runner]];
}

export type RunnerManifest = {
	scripts?: Record<string, string>;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	jest?: unknown;
};

/**
 * The runner a `package.json` tests with, or `null` when it names none.
 *
 * The `test` script is read first: it is the runner the project actually
 * invokes, where a dependency may be a leftover. `jest-expo` is Expo's own
 * preset, so it counts as Jest.
 */
export function detectTestRunner(manifest: RunnerManifest): TestRunner | null {
	const script = manifest.scripts?.test ?? "";
	if (/\bvitest\b/.test(script)) return "vitest";
	if (/\bjest\b/.test(script)) return "jest";
	if (/\bbun\s+test\b/.test(script)) return "bun";

	const packages = { ...manifest.dependencies, ...manifest.devDependencies };
	if ("vitest" in packages) return "vitest";
	if ("jest" in packages || "jest-expo" in packages || manifest.jest !== undefined) return "jest";

	return null;
}
