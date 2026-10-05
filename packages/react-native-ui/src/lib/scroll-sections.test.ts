import { describe, expect, test } from "bun:test";
import { resolveActiveSection, resolveScrollProgress, resolveSectionScrollTarget } from "./scroll-sections";

const sections = [
	{ id: "intro", y: 0 },
	{ id: "setup", y: 400 },
	{ id: "usage", y: 1000 },
];

describe("resolveActiveSection", () => {
	test("returns undefined with no sections", () => {
		expect(resolveActiveSection([], 100, 0)).toBeUndefined();
	});

	test("picks the last section whose top has crossed the reading line", () => {
		expect(resolveActiveSection(sections, 0, 0)).toBe("intro");
		expect(resolveActiveSection(sections, 399, 0)).toBe("intro");
		expect(resolveActiveSection(sections, 400, 0)).toBe("setup");
		expect(resolveActiveSection(sections, 2000, 0)).toBe("usage");
	});

	test("the reading line moves the switch earlier", () => {
		expect(resolveActiveSection(sections, 304, 96)).toBe("setup");
		expect(resolveActiveSection(sections, 303, 96)).toBe("intro");
	});

	test("above the first section reads as the first section", () => {
		expect(resolveActiveSection([{ id: "a", y: 200 }], 0, 0)).toBe("a");
		expect(resolveActiveSection(sections, -80, 0)).toBe("intro");
	});

	test("reads sections in offset order, not registration order", () => {
		const shuffled = [sections[2], sections[0], sections[1]].filter((s) => s !== undefined);
		expect(resolveActiveSection(shuffled, 500, 0)).toBe("setup");
	});
});

describe("resolveScrollProgress", () => {
	test("is 0 at the top and 1 at the end", () => {
		expect(resolveScrollProgress(0, 2000, 800)).toBe(0);
		expect(resolveScrollProgress(1200, 2000, 800)).toBe(1);
		expect(resolveScrollProgress(600, 2000, 800)).toBe(0.5);
	});

	test("clamps overscroll at both ends", () => {
		expect(resolveScrollProgress(-50, 2000, 800)).toBe(0);
		expect(resolveScrollProgress(1500, 2000, 800)).toBe(1);
	});

	test("is 1 when nothing scrolls", () => {
		expect(resolveScrollProgress(0, 500, 800)).toBe(1);
		expect(resolveScrollProgress(0, 800, 800)).toBe(1);
	});
});

describe("resolveSectionScrollTarget", () => {
	test("puts the section's top on the reading line", () => {
		expect(resolveSectionScrollTarget(400, 96)).toBe(304);
	});

	test("never scrolls above the top", () => {
		expect(resolveSectionScrollTarget(40, 96)).toBe(0);
	});
});
