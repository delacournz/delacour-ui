import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const COMPONENTS = join(import.meta.dirname, "components");

/**
 * Every variant axis a component declares must reach its public entry point.
 *
 * An axis is a `const` array and the union read off it —
 * `BADGE_MATERIALS` and `BadgeMaterial`. The union types a prop; the array is how
 * a caller iterates the values, builds a picker or a story, or narrows a string
 * from outside. `Badge`, `Button` and `Surface` each grew a public `material`
 * prop whose pair stayed behind `index.ts`, so a caller could pass the prop but
 * not name its type without reaching into a file the package does not export.
 *
 * Like `docs.test.ts`, this reads the tree as **text** and imports nothing from
 * it: an axis is recognised by its declaration,
 * `export type Name = (typeof NAME)[number]`, and both names must appear in the
 * folder's `index.ts` export lists. Declaring an axis that way is declaring it
 * public — an internal union is a plain string-literal type and is not checked.
 */

type Axis = { file: string; type: string; values: string };

const AXIS = /^export type ([A-Za-z0-9_]+) = \(typeof ([A-Z0-9_]+)\)\[number\];/gm;

/** Every component folder's non-test modules, as relative path → source. */
function modules(folder: string): Map<string, string> {
	const found = new Map<string, string>();
	for (const entry of readdirSync(join(COMPONENTS, folder), { withFileTypes: true })) {
		if (!entry.isFile() || !/\.tsx?$/.test(entry.name) || entry.name.includes(".test.")) continue;
		if (entry.name === "index.ts") continue;
		found.set(`${folder}/${entry.name}`, readFileSync(join(COMPONENTS, folder, entry.name), "utf-8"));
	}
	return found;
}

/** The axes one module declares. */
function axesIn(file: string, source: string): Axis[] {
	return [...source.matchAll(AXIS)].map(([, type, values]) => ({ file, type, values }));
}

/** Every name inside an `export { … }` or `export type { … }` list of an index. */
function exportedNames(index: string): Set<string> {
	const names = new Set<string>();
	for (const [, list] of index.matchAll(/export (?:type )?\{([^}]*)\}/g)) {
		for (const raw of list.split(",")) {
			const name = raw
				.trim()
				.replace(/^type\s+/, "")
				.split(/\s+as\s+/)
				.pop();
			if (name) names.add(name);
		}
	}
	return names;
}

const FOLDERS = readdirSync(COMPONENTS, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name)
	.sort();

const AXES = FOLDERS.flatMap((folder) => {
	const exported = exportedNames(readFileSync(join(COMPONENTS, folder, "index.ts"), "utf-8"));
	return [...modules(folder)].flatMap(([file, source]) => axesIn(file, source).map((axis) => ({ ...axis, exported })));
});

describe("variant axes", () => {
	// A matcher that found nothing would pass every assertion below on an empty set.
	test("finds the axes", () => {
		expect(AXES.length).toBeGreaterThan(50);
	});

	test("every axis union is exported from its component's index", () => {
		const missing = AXES.filter((axis) => !axis.exported.has(axis.type)).map((axis) => `${axis.file}: ${axis.type}`);
		expect(missing).toEqual([]);
	});

	test("every axis array is exported from its component's index", () => {
		const missing = AXES.filter((axis) => !axis.exported.has(axis.values)).map(
			(axis) => `${axis.file}: ${axis.values}`
		);
		expect(missing).toEqual([]);
	});
});
