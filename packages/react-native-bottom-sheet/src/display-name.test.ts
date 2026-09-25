import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = import.meta.dirname;

/**
 * Every component in the package must carry a `DelacourBottomSheet.`-prefixed
 * displayName.
 *
 * React DevTools reads `displayName || name`, so without one a tree row, an
 * error stack and a profiler entry all read the private symbol —
 * `BottomSheetHandle` rather than `DelacourBottomSheet.BottomSheet.Handle`.
 * `bun test` cannot render React Native, so the convention is checked against
 * the source text instead: this file reads the `.tsx` tree off disk and imports
 * nothing from it. It is the same test `@delacour/react-native-ui` runs, with
 * the prefix changed, so a skin and its engine never answer to one name.
 *
 * The corpus spans every file at once rather than checking each in isolation,
 * because a root is declared in one file and named by the `Object.assign` in
 * another.
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
 * A PascalCase `function` declaration, or a `memo(…)` / `forwardRef(…)` const.
 *
 * Those are the only three shapes a component takes here: the package has no
 * arrow-function components. A PascalCase helper would be a false positive —
 * write helpers in camelCase.
 */
const DECLARATIONS = [
	/^(?:export )?function ([A-Z][A-Za-z0-9]*)\s*[<(]/gm,
	/^(?:export )?const ([A-Z][A-Za-z0-9]*) = memo\(/gm,
	/^(?:export )?const ([A-Z][A-Za-z0-9]*) = forwardRef[<(]/gm,
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

/** `DelacourBottomSheet` plus one segment per step down the public API. */
const SHAPE = /^DelacourBottomSheet(\.[A-Z][A-Za-z0-9]*)+$/;

/**
 * The floor under the walker. The package has no `.tsx` yet; BSHEET-2 raises
 * both to a real count so a walker matching nothing cannot keep the suite green
 * on an empty set.
 */
const MIN_SOURCES = 0;
const MIN_DECLARED = 0;

describe("displayName", () => {
	test("finds the component tree", () => {
		expect(SOURCES.size).toBeGreaterThanOrEqual(MIN_SOURCES);
		expect(DECLARED.size).toBeGreaterThanOrEqual(MIN_DECLARED);
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

	test("every name is a DelacourBottomSheet path", () => {
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
	// of it. This is what keeps `BottomSheet.Handle` from drifting to `BottomSheet.Grip`.
	test("every name descends from a component that exists", () => {
		const names = new Set([...BOUND.values()].flat());
		const orphans = [...names].filter((name) => {
			const parent = name.slice(0, name.lastIndexOf("."));
			return parent !== "DelacourBottomSheet" && !names.has(parent);
		});
		expect(orphans).toEqual([]);
	});
});
