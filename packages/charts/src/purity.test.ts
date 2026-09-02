import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { read, relative, SRC, sourceFiles } from "./source-tree.test";

/**
 * Modules `src/core` may not import a runtime value from.
 *
 * React Native ships Flow-typed source that Bun's transpiler cannot parse, so
 * one of these anywhere under `core/` takes the *entire* suite down — and the
 * error names whichever file happened to import the offender first, not the
 * file that broke the rule. Hence this test: it fails first, and it fails by
 * name.
 *
 * Type-only imports are fine. Types are erased before Bun sees them.
 */
const FORBIDDEN = [
	"react",
	"react-native",
	"react-dom",
	"@shopify/react-native-skia",
	"react-native-reanimated",
	"react-native-gesture-handler",
	"react-native-worklets",
];

const IMPORT = /^\s*import\s+([\s\S]*?)\s*from\s*["']([^"']+)["']/gm;

/** Whether an import clause brings in nothing but types. */
function isTypeOnly(clause: string): boolean {
	const trimmed = clause.trim();
	if (trimmed.startsWith("type ")) return true;

	const named = trimmed.match(/^\{([\s\S]*)\}$/);
	if (!named) return false;

	return (named[1] as string)
		.split(",")
		.map((specifier) => specifier.trim())
		.filter((specifier) => specifier !== "")
		.every((specifier) => specifier.startsWith("type "));
}

describe("core purity", () => {
	const files = sourceFiles(join(SRC, "core"));

	test("finds the core modules, so a broken walker cannot pass silently", () => {
		expect(files.length).toBeGreaterThan(20);
	});

	test("no module under src/core imports a React Native runtime value", () => {
		const offenders: string[] = [];

		for (const file of files) {
			const source = read(file);
			IMPORT.lastIndex = 0;
			for (let match = IMPORT.exec(source); match !== null; match = IMPORT.exec(source)) {
				const clause = match[1] as string;
				const specifier = match[2] as string;
				const root = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
				if (!FORBIDDEN.includes(root as string)) continue;
				if (isTypeOnly(clause)) continue;
				offenders.push(`${relative(file)} imports ${specifier}`);
			}
		}

		expect(offenders).toEqual([]);
	});

	test("no module under src/core reaches sideways into src/skia", () => {
		const offenders = files
			.filter((file) => /from\s+["'][^"']*\/skia\//.test(read(file)))
			.map((file) => relative(file));
		expect(offenders).toEqual([]);
	});
});
