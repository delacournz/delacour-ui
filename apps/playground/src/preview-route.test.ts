import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * `app/preview.tsx` imports the demo registry, which imports React Native, so
 * it is read as text — and from outside `src/app`, because Expo Router turns
 * every file in that folder into a route, a test file included: the one thing this holds is which preset the capture frame
 * pins, because the documentation site is painted from the house and a capture
 * in any other theme would sit on the page as a component from somewhere else.
 */
const source = readFileSync(join(import.meta.dirname, "app", "preview.tsx"), "utf8");

describe("the capture frame", () => {
	test("pins the house preset before it photographs anything", () => {
		expect(source).toContain('import { HOUSE_CONFIG } from "@delacour/design-system/house"');
		expect(source).toContain("applyConfig(HOUSE_CONFIG)");
	});

	test("no longer reaches for the library default", () => {
		expect(source).not.toContain("DEFAULT_CONFIG");
	});

	test("applies without storing, so the user's own configuration survives", () => {
		expect(source).not.toContain("setAxis(");
		expect(source).not.toContain("resetConfig(");
	});
});
