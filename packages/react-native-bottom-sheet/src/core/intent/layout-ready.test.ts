import { describe, expect, test } from "bun:test";
import { isLayoutReady } from "./layout-ready";

const measured = {
	containerHeight: 800,
	handleHeight: 24,
	contentHeight: 300,
	footerContentHeight: 56,
	dynamicSizing: true,
	hasFooter: true,
};

describe("isLayoutReady", () => {
	test("ready once every measurement the configuration needs has landed", () => {
		expect(isLayoutReady(measured)).toBe(true);
	});

	test("never ready without a container", () => {
		expect(isLayoutReady({ ...measured, containerHeight: -1 })).toBe(false);
		expect(isLayoutReady({ ...measured, containerHeight: 0 })).toBe(false);
	});

	test("waits for the handle — a zero-height handle counts as measured", () => {
		expect(isLayoutReady({ ...measured, handleHeight: -1 })).toBe(false);
		expect(isLayoutReady({ ...measured, handleHeight: 0 })).toBe(true);
	});

	test("waits for content only when sizing to it", () => {
		expect(isLayoutReady({ ...measured, contentHeight: -1 })).toBe(false);
		expect(isLayoutReady({ ...measured, contentHeight: -1, dynamicSizing: false })).toBe(true);
	});

	test("waits for the footer only when there is one", () => {
		expect(isLayoutReady({ ...measured, footerContentHeight: -1 })).toBe(false);
		expect(isLayoutReady({ ...measured, footerContentHeight: -1, hasFooter: false })).toBe(true);
	});
});
