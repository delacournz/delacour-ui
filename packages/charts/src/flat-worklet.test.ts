import { describe, expect, test } from "bun:test";
import { read, relative, SRC, sourceFiles } from "./source-tree.test";

/**
 * The flat-worklet rule.
 *
 * **A worklet declared at module scope may close over module-scope constants
 * but never over another function, imported or local.** Any helper it needs is
 * declared inside its own body.
 *
 * Module scope is the whole rule. A module-scope worklet that calls another
 * module-scope worklet binds at import time in source order, and the UI thread
 * gets `undefined is not a function` — at the moment a finger touches the
 * chart, on a device, with a stack that names neither function. Four
 * components in `@delacour/native-ui` document having learned this.
 *
 * A worklet created *inside* a hook is captured by ordinary closure and may
 * call whatever it likes, including the module-scope worklets here. That is
 * how the gesture layer composes `closestIndex` and `getYForX` without
 * duplicating sixty lines of solver.
 */

/** Members of these are always safe — they exist in every worklet runtime. */
const GLOBAL_NAMESPACES = ["Math", "Number", "Array", "Object", "String", "JSON", "Boolean", "Date"];

/** Control-flow keywords that look like calls to a regex. */
const KEYWORDS = new Set(["if", "for", "while", "switch", "catch", "return", "typeof", "function", "new"]);

/** The body of the block opening at `open`, by brace matching. */
function blockAt(source: string, open: number): string {
	let depth = 0;
	for (let index = open; index < source.length; index += 1) {
		const char = source[index];
		if (char === "{") depth += 1;
		else if (char === "}") {
			depth -= 1;
			if (depth === 0) return source.slice(open + 1, index);
		}
	}
	return source.slice(open + 1);
}

/** Bodies of every column-zero `function` whose first statement is the directive. */
function moduleScopeWorklets(source: string): { readonly name: string; readonly body: string }[] {
	const found: { name: string; body: string }[] = [];
	const declaration = /^(?:export\s+)?function\s+(\w+)/gm;

	for (let match = declaration.exec(source); match !== null; match = declaration.exec(source)) {
		const open = source.indexOf("{", match.index);
		if (open === -1) continue;
		const body = blockAt(source, open);
		if (!body.trimStart().startsWith('"worklet";')) continue;
		found.push({ name: match[1] as string, body });
	}

	return found;
}

/** Value names this module imports — the ones a module-scope worklet must not call. */
function importedValues(source: string): Set<string> {
	const names = new Set<string>();
	const pattern = /^\s*import\s+([\s\S]*?)\s*from\s*["'][^"']+["']/gm;
	for (let match = pattern.exec(source); match !== null; match = pattern.exec(source)) {
		const clause = (match[1] as string).trim();
		if (clause.startsWith("type ")) continue;
		const named = clause.match(/\{([\s\S]*)\}/);
		if (named) {
			for (const raw of (named[1] as string).split(",")) {
				const specifier = raw.trim();
				if (specifier === "" || specifier.startsWith("type ")) continue;
				names.add((specifier.split(/\s+as\s+/).pop() as string).trim());
			}
		}
		const bare = clause
			.replace(/\{[\s\S]*\}/, "")
			.replace(/,/g, "")
			.trim();
		if (bare !== "" && !bare.startsWith("*")) names.add(bare);
	}
	return names;
}

/** Functions declared at module scope — also off limits inside a module-scope worklet. */
function functionNames(source: string): Set<string> {
	const names = new Set<string>();
	const patterns = [
		/(?:^|\n)\s*(?:export\s+)?function\s+(\w+)/g,
		/(?:^|\n)\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*(?::[^=]+)?=>/g,
	];
	for (const pattern of patterns) {
		for (let match = pattern.exec(source); match !== null; match = pattern.exec(source)) {
			names.add(match[1] as string);
		}
	}
	return names;
}

describe("flat worklets", () => {
	const files = sourceFiles(SRC, { skipTests: true });

	test("finds the module-scope worklets, so a broken walker cannot pass silently", () => {
		const total = files.reduce((count, file) => count + moduleScopeWorklets(read(file)).length, 0);
		expect(total).toBeGreaterThan(3);
	});

	test("no module-scope worklet calls an imported or module-scope function", () => {
		const offenders: string[] = [];

		for (const file of files) {
			const source = read(file);
			if (!source.includes('"worklet";')) continue;
			const forbidden = new Set([...importedValues(source), ...functionNames(source)]);

			for (const worklet of moduleScopeWorklets(source)) {
				const declaredInside = functionNames(worklet.body);
				const calls = /(?:^|[^.\w$])(\w+)\s*\(/g;

				for (let call = calls.exec(worklet.body); call !== null; call = calls.exec(worklet.body)) {
					const name = call[1] as string;
					if (KEYWORDS.has(name) || GLOBAL_NAMESPACES.includes(name)) continue;
					if (declaredInside.has(name) || name === worklet.name) continue;
					if (!forbidden.has(name)) continue;
					offenders.push(`${relative(file)}: ${worklet.name}() calls ${name}()`);
				}
			}
		}

		expect(offenders).toEqual([]);
	});
});
