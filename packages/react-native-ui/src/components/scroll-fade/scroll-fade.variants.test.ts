import { describe, expect, test } from "bun:test";
import { SCROLL_EDGES } from "../../lib/scroll-edges";
import {
	SCROLL_FADE_DEFAULT_DISTANCE,
	SCROLL_FADE_DEFAULT_SIZE,
	SCROLL_FADE_EDGES,
	scrollFadeVariants,
} from "./scroll-fade.variants";

describe("SCROLL_FADE_EDGES", () => {
	test("is the shared edge union, not a copy of it", () => {
		expect(SCROLL_FADE_EDGES).toBe(SCROLL_EDGES);
	});
});

describe("defaults", () => {
	test("a fade is 48 points deep", () => {
		expect(SCROLL_FADE_DEFAULT_SIZE).toBe(48);
	});

	test("an edge arrives over 24 points of travel", () => {
		expect(SCROLL_FADE_DEFAULT_DISTANCE).toBe(24);
	});
});

describe("scrollFadeVariants", () => {
	test("the root is the positioning context for its bands", () => {
		expect(scrollFadeVariants().root()).toContain("relative");
	});

	test("a vertical band spans the width", () => {
		const band = scrollFadeVariants({ orientation: "vertical" }).band();
		expect(band).toContain("absolute");
		expect(band).toContain("inset-x-0");
	});

	test("a horizontal band spans the height", () => {
		const band = scrollFadeVariants({ orientation: "horizontal" }).band();
		expect(band).toContain("absolute");
		expect(band).toContain("inset-y-0");
	});

	test("vertical is the default", () => {
		expect(scrollFadeVariants().band()).toContain("inset-x-0");
	});

	test("a caller's className merges onto the root", () => {
		expect(scrollFadeVariants().root({ className: "flex-1" })).toContain("flex-1");
	});
});
