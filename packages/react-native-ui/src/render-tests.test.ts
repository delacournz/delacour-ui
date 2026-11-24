import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const COMPONENTS = join(import.meta.dirname, "components");

/**
 * Every component folder must carry a `{name}.render.test.tsx`.
 *
 * Render tests run under Jest (`test:render`), which `bun test` cannot do — so,
 * like `docs.test.ts`, this reads the folder tree and imports nothing.
 */
function componentFolders(): string[] {
	return readdirSync(COMPONENTS, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}

const hasRenderTest = (name: string): boolean => existsSync(join(COMPONENTS, name, `${name}.render.test.tsx`));

describe("render tests", () => {
	test("every component has one", () => {
		const missing = componentFolders().filter((name) => !hasRenderTest(name));
		expect(missing).toEqual([]);
	});
});
