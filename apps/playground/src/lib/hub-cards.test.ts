import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BLOCKS } from "@/blocks/block-index";
import { componentCount } from "@/components-index";
import { HUB_CARDS } from "./hub-cards";

const APP = join(import.meta.dirname, "..", "app");

describe("HUB_CARDS", () => {
	test("components then blocks, in that order", () => {
		expect(HUB_CARDS.map((card) => card.slug)).toEqual(["components", "blocks"]);
	});

	test("counts come from the indexes the lists draw", () => {
		const count = Object.fromEntries(HUB_CARDS.map((card) => [card.slug, card.count]));
		expect(count.components).toBe(componentCount());
		expect(count.blocks).toBe(BLOCKS.length);
	});

	test("every card's href is its slug, and the route file exists", () => {
		for (const card of HUB_CARDS) {
			expect(card.href).toBe(`/${card.slug}`);
			expect(existsSync(join(APP, `${card.slug}.tsx`))).toBe(true);
		}
	});

	test("the two glows sit in opposite corners", () => {
		expect(new Set(HUB_CARDS.map((card) => card.glow.corner)).size).toBe(HUB_CARDS.length);
	});
});
