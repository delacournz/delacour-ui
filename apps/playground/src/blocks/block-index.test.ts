import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BLOCKS } from "./block-index";

const ROUTES = join(import.meta.dirname, "..", "app", "(blocks)");

describe("BLOCKS", () => {
	test("slugs are unique", () => {
		expect(new Set(BLOCKS.map((block) => block.slug)).size).toBe(BLOCKS.length);
	});

	test("every block has a route file, and its href is the slug", () => {
		for (const block of BLOCKS) {
			expect(block.href).toBe(`/${block.slug}`);
			expect(existsSync(join(ROUTES, `${block.slug}.tsx`))).toBe(true);
		}
	});
});
