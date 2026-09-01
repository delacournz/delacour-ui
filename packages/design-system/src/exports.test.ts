import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { GEOMETRY_TOKENS, type GeometryValues, STYLES } from "./styles";

const ROOT = join(import.meta.dirname, "..");

/**
 * The half of a `gen-exports` script that catches real mistakes.
 *
 * `native-ui` generates its map because component folders churn; ten stable
 * entries do not earn a generator. What they do earn is this: an entry pointing
 * at a file that no longer exists resolves to nothing at the consumer, and a
 * module with no entry is unreachable however correct it is — neither shows up
 * in a typecheck of this package, because nothing in here imports through the
 * package's own name.
 */
describe("the exports map", () => {
	const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as {
		exports: Record<string, string>;
	};
	const targets = Object.values(manifest.exports);

	test("every target exists on disk", () => {
		for (const target of targets) {
			expect(existsSync(join(ROOT, target))).toBe(true);
		}
	});

	test("every module is reachable, exactly once", () => {
		const modules = readdirSync(join(ROOT, "src"))
			.filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts") && !file.endsWith(".d.ts"))
			.map((file) => `./src/${file}`);

		for (const module of modules) {
			expect(targets.filter((target) => target === module)).toHaveLength(1);
		}
	});

	/**
	 * No `"."` barrel, and that is load-bearing rather than an omission.
	 * `apps/playground/app.config.ts` reads only `FONTS`, through Node's CJS
	 * loader — a barrel would make every `expo prebuild`, `expo start` and
	 * `expo config` transpile and evaluate nineteen hundred lines of oklch data
	 * to get at one array.
	 */
	test("declares no root entry", () => {
		expect(manifest.exports["."]).toBeUndefined();
	});
});

describe("GEOMETRY_TOKENS", () => {
	test("names exactly the keys a style writes", () => {
		const declared = [...GEOMETRY_TOKENS].sort();
		const actual = Object.keys((STYLES[0] as (typeof STYLES)[number]).geometry).sort() as (keyof GeometryValues)[];

		expect(declared).toEqual(actual);
	});

	test("every style writes every one of them", () => {
		for (const style of STYLES) {
			for (const token of GEOMETRY_TOKENS) {
				expect(typeof style.geometry[token]).toBe("number");
			}
		}
	});
});
