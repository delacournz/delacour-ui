import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = import.meta.dirname;
const COMPONENTS = join(SRC, "components");
const PACKAGE_DOC = join(SRC, "..", "AGENTS.md");

/**
 * Every component folder must carry an `AGENTS.md`, and the package doc must
 * index it.
 *
 * `Radio` shipped exported, tested and rendered in the playground, and stayed
 * undocumented for fifteen commits — while nine bullets in other sections
 * already pointed at rules nobody had written down. Nothing caught it, because
 * nothing was looking. This looks.
 *
 * The index table is the second assertion for a reason: a folder can hold an
 * `AGENTS.md` nobody can find. A component absent from the table is a component
 * an agent reaches only by already knowing it exists, which is the same failure
 * one step later.
 *
 * Like `display-name.test.ts` and `styles/tokens.test.ts`, this reads the tree as
 * **text** and imports nothing from it. That is the move available whenever a
 * convention is real but no renderer can check it — and `bun test` cannot render
 * React Native at all.
 */

/** Every directory under `src/components/`, by folder name. */
function componentFolders(): string[] {
	return readdirSync(COMPONENTS, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}

/**
 * The folder names the package doc's index table lists.
 *
 * Matched on the export subpath rather than the heading, because the two are not
 * the same word: `provider` is `DelacourProvider` and `list-group` is
 * `ListGroup`. The subpath is the unambiguous key, and it is the string a
 * consumer actually types.
 */
function indexedFolders(): string[] {
	const doc = readFileSync(PACKAGE_DOC, "utf-8");
	const rows = doc.matchAll(/\[`?@delacour\/native-ui\/([a-z-]+)`?\]|`@delacour\/native-ui\/([a-z-]+)`/g);
	return [...new Set([...rows].map(([, a, b]) => a ?? b))].sort();
}

const FOLDERS = componentFolders();
const INDEXED = indexedFolders();

describe("component docs", () => {
	// A walker that found nothing would let every assertion below pass on an
	// empty set, so the suite would stay green while the convention rotted.
	test("finds the component tree", () => {
		expect(FOLDERS.length).toBeGreaterThan(15);
	});

	test("every component folder has an AGENTS.md", () => {
		const missing = FOLDERS.filter((name) => !existsSync(join(COMPONENTS, name, "AGENTS.md")));
		expect(missing).toEqual([]);
	});

	// An empty file passes the check above and helps nobody.
	test("no component doc is a stub", () => {
		const stubs = FOLDERS.filter((name) => {
			const path = join(COMPONENTS, name, "AGENTS.md");
			if (!existsSync(path)) return false;
			const doc = readFileSync(path, "utf-8");
			return !doc.startsWith("# ") || doc.split("\n").length < 10;
		});
		expect(stubs).toEqual([]);
	});

	// This is the assertion that would have caught Radio.
	test("every component is named in the package doc", () => {
		const unlisted = FOLDERS.filter((name) => !INDEXED.includes(name));
		expect(unlisted).toEqual([]);
	});

	// A row naming a folder that no longer exists is a rename that landed in one
	// place, and it sends a reader to a path that will not resolve.
	test("the package doc names no component that does not exist", () => {
		const orphans = INDEXED.filter((name) => !FOLDERS.includes(name));
		expect(orphans).toEqual([]);
	});
});
