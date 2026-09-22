import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sourceRoots, staticPrefix } from "./sources";

const GLOBAL_CSS = resolve(import.meta.dir, "global.css");

/**
 * Every `@source` in `global.css` has to name a directory that exists, because
 * Tailwind treats a missing one as an empty one. Build 5 shipped with the library
 * directive still pointing at `packages/native-ui/src` after the folder had been
 * renamed, and lost 211 rules — every gutter, safe-area and padding class that
 * only the library uses — without a warning from any tool. This is the warning.
 */
describe("global.css @source directives", () => {
	test("each one resolves to a directory that exists", () => {
		const roots = sourceRoots(readFileSync(GLOBAL_CSS, "utf8"), GLOBAL_CSS);
		expect(roots.length).toBeGreaterThan(0);
		const missing = roots.filter((r) => !r.exists).map((r) => `${r.directive} → ${r.root}`);
		expect(missing).toEqual([]);
	});

	test("the library is scanned by its real workspace path", () => {
		const roots = sourceRoots(readFileSync(GLOBAL_CSS, "utf8"), GLOBAL_CSS);
		const library = resolve(import.meta.dir, "../../../../packages/react-native-ui/src");
		expect(roots.map((r) => r.root)).toContain(library);
	});

	test("a directive at the pre-rename path is reported missing", () => {
		const css = `@source "../../../../packages/native-ui/src";`;
		const [root] = sourceRoots(css, GLOBAL_CSS);
		expect(root.exists).toBe(false);
		expect(root.root).toEndWith("packages/native-ui/src");
	});
});

describe("staticPrefix", () => {
	test("keeps a plain directory", () => {
		expect(staticPrefix("../../packages/x/src")).toBe("../../packages/x/src");
	});
	test("stops a glob at its first wildcard segment", () => {
		expect(staticPrefix("../**/*.{ts,tsx}")).toBe("..");
		expect(staticPrefix("../src/**/*.tsx")).toBe("../src");
	});
});
