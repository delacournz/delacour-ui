import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

type Babel = {
	transformSync: (
		code: string,
		options: {
			filename: string;
			babelrc: false;
			configFile: false;
			presets: readonly [string, { isTSX: true; allExtensions: true }][];
			plugins: readonly (string | [string, Record<string, never>])[];
		}
	) => { code?: string | null } | null;
};

const require = createRequire(import.meta.url);
const babel = require("@babel/core") as Babel;

const ROOT = join(import.meta.dir, "../../..");
const SOURCES = ["packages/*/src/**/*.{ts,tsx}", "apps/playground/src/**/*.{ts,tsx}"];
const WORKLET_IMPORT = /from "react-native-(gesture-handler|reanimated|worklets)"/;

/** Every source file Metro hands to the Worklets plugin with something for it to workletize. */
function workletSources(): string[] {
	const files: string[] = [];
	for (const pattern of SOURCES) {
		for (const file of new Bun.Glob(pattern).scanSync({ cwd: ROOT })) {
			if (file.includes("/node_modules/") || file.endsWith(".test.ts") || file.endsWith(".d.ts")) continue;
			if (WORKLET_IMPORT.test(readFileSync(join(ROOT, file), "utf8"))) files.push(file);
		}
	}
	return files.sort();
}

type Transformed = { kind: "ok"; code: string } | { kind: "error"; message: string };

/**
 * One file through the React Compiler and then the Worklets plugin — the order
 * the playground's `reactCompiler: true` puts them in, and so the order Metro
 * runs them in for every workspace source it bundles.
 */
function transform(file: string): Transformed {
	try {
		const result = babel.transformSync(readFileSync(join(ROOT, file), "utf8"), {
			filename: join(ROOT, file),
			babelrc: false,
			configFile: false,
			presets: [["@babel/preset-typescript", { isTSX: true, allExtensions: true }]],
			plugins: [["babel-plugin-react-compiler", {}], "react-native-worklets/plugin"],
		});
		return { kind: "ok", code: result?.code ?? "" };
	} catch (error) {
		const message = error instanceof Error ? (error.message.split("\n")[0] ?? error.message) : String(error);
		return { kind: "error", message };
	}
}

const CLOSURE = /\.__closure = \[([^\]]*)\]/g;
const HOISTED = /^_temp\d*$/;

/**
 * Hoisted functions a worklet captures that are not worklets themselves.
 *
 * The React Compiler lifts a capture-free arrow out of a component into a
 * module-level `_temp`. Inside a worklet — `list.map((bar) => bar.height)` —
 * that leaves the worklet calling a plain JavaScript function, and the UI thread
 * throws "Tried to synchronously call a Remote Function" on the first gesture.
 */
function hoistedRemoteFunctions(code: string): string[] {
	const names = new Set<string>();
	for (const [, list = ""] of code.matchAll(CLOSURE)) {
		for (const name of list.split(",").map((entry) => entry.trim())) {
			if (HOISTED.test(name) && !code.includes(`${name}.__workletHash`)) names.add(name);
		}
	}
	return [...names];
}

/**
 * Runs the Worklets Babel plugin over every file that uses a worklet, the way
 * Metro does before it bundles one.
 *
 * Two failures `tsc` and Biome both pass, each found on a device first. A
 * spread in a gesture hook's config — `usePanGesture({ ...activation, … })` —
 * makes the plugin throw, and Metro answers every request with HTTP 500. And a
 * capture-free arrow inside a component's worklet is hoisted out of it by the
 * React Compiler, which only fails when a finger first moves. Nothing else in
 * `bun test` runs either plugin, so without this the first to know is whoever
 * next opens the app.
 */
describe("the Worklets Babel plugin", () => {
	const files = workletSources();

	test("finds the files to check", () => {
		expect(files.length).toBeGreaterThan(50);
	});

	const results = files.map((file) => ({ file, result: transform(file) }));

	test("transforms every file that uses a worklet", () => {
		const failures = results.flatMap(({ file, result }) =>
			result.kind === "error" ? [`${file}: ${result.message}`] : []
		);
		expect(failures).toEqual([]);
	});

	test("leaves no worklet calling a function the React Compiler hoisted", () => {
		const failures = results.flatMap(({ file, result }) => {
			if (result.kind === "error") return [];
			const names = hoistedRemoteFunctions(result.code);
			return names.length === 0 ? [] : [`${file}: captures ${names.join(", ")}`];
		});
		expect(failures).toEqual([]);
	});
});
