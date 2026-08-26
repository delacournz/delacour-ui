import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = import.meta.dirname;

/**
 * Every component in the package must carry a `DelacourUI.`-prefixed displayName.
 *
 * React DevTools reads `displayName || name`, so without one a tree row, an error
 * stack and a profiler entry all read the private symbol — `ScreenNavbarTitle`
 * rather than `DelacourUI.Screen.Navbar.Title`. `bun test` cannot render React
 * Native, so the convention is checked against the source text instead: this file
 * reads the `.tsx` tree off disk and imports nothing from it.
 *
 * The corpus spans every file at once rather than checking each in isolation,
 * because `ScreenRoot` is declared in `screen-root.tsx` and named by the
 * `Object.assign` in `screen.tsx` — see components/screen/AGENTS.md for why the
 * two cannot share a file.
 */

/** Every `.tsx` under `src/`, as a path → source map. */
function sources(): Map<string, string> {
	const found = new Map<string, string>();
	const walk = (dir: string): void => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) walk(path);
			else if (entry.name.endsWith(".tsx")) found.set(path, readFileSync(path, "utf-8"));
		}
	};
	walk(SRC);
	return found;
}

const SOURCES = sources();

/**
 * A PascalCase `function` declaration, or a `memo(function …)` const.
 *
 * Those are the only two shapes a component takes here: the package has no
 * arrow-function components, and every PascalCase function declaration in it
 * returns `ReactElement`, `ReactElement | null` or `null`. A PascalCase helper
 * would be a false positive — write helpers in camelCase, as the package already
 * does (`wrapTextChildren`, `withDividers`, `resolveListComponent`).
 */
const DECLARATIONS = [
	/^(?:export )?function ([A-Z][A-Za-z0-9]*)\s*[<(]/gm,
	/^(?:export )?const ([A-Z][A-Za-z0-9]*) = memo\(/gm,
];

/** The trailing form on a part, and the `Object.assign` form on a root. */
const BINDINGS = [
	/^([A-Z][A-Za-z0-9]*)\.displayName = "([^"]*)";/gm,
	/Object\.assign\(\s*([A-Z][A-Za-z0-9]*)\s*,\s*\{[\s\S]*?displayName: "([^"]*)"/gm,
];

/** Component name → the file it is declared in. */
function declared(): Map<string, string> {
	const found = new Map<string, string>();
	for (const [path, source] of SOURCES) {
		for (const pattern of DECLARATIONS) {
			for (const [, name] of source.matchAll(pattern)) found.set(name, path);
		}
	}
	return found;
}

/** Component name → every displayName bound to it, across the whole tree. */
function bound(): Map<string, string[]> {
	const found = new Map<string, string[]>();
	for (const source of SOURCES.values()) {
		for (const pattern of BINDINGS) {
			for (const [, name, value] of source.matchAll(pattern)) {
				found.set(name, [...(found.get(name) ?? []), value]);
			}
		}
	}
	return found;
}

const DECLARED = declared();
const BOUND = bound();

/** `DelacourUI` plus one segment per step down the public API. */
const SHAPE = /^DelacourUI(\.[A-Z][A-Za-z0-9]*)+$/;

describe("displayName", () => {
	// A walker that matched nothing would let every assertion below pass on an
	// empty set, so the suite would stay green while the convention rotted.
	test("finds the component tree", () => {
		expect(SOURCES.size).toBeGreaterThan(50);
		expect(DECLARED.size).toBeGreaterThan(80);
	});

	test("every component has one", () => {
		const missing = [...DECLARED]
			.filter(([name]) => !BOUND.has(name))
			.map(([name, path]) => `${name} (${path.slice(SRC.length + 1)})`);
		expect(missing).toEqual([]);
	});

	// Two bindings on one component is a rename that only landed in one place.
	test("no component has two", () => {
		const doubled = [...BOUND].filter(([, values]) => values.length > 1).map(([name]) => name);
		expect(doubled).toEqual([]);
	});

	test("every name is a DelacourUI path", () => {
		const wrong = [...BOUND]
			.filter(([, values]) => values.some((value) => !SHAPE.test(value)))
			.map(([name, values]) => `${name} = ${values[0]}`);
		expect(wrong).toEqual([]);
	});

	// Two components answering to one name is a copy-pasted part file.
	test("no two components share a name", () => {
		const seen = new Map<string, string>();
		const clashes: string[] = [];
		for (const [name, values] of BOUND) {
			for (const value of values) {
				const owner = seen.get(value);
				if (owner) clashes.push(`${value}: ${owner} and ${name}`);
				else seen.set(value, name);
			}
		}
		expect(clashes).toEqual([]);
	});

	// A part's name is its path in the public API, so its root's name is a prefix
	// of it. This is what keeps `Badge.Label` from drifting to `Badge.Text`.
	test("every name descends from a component that exists", () => {
		const names = new Set([...BOUND.values()].flat());
		const orphans = [...names].filter((name) => {
			const parent = name.slice(0, name.lastIndexOf("."));
			return parent !== "DelacourUI" && !names.has(parent);
		});
		expect(orphans).toEqual([]);
	});
});
