import { describe, expect, test } from "bun:test";
import { Children, createElement, isValidElement, type ReactElement } from "react";
import { wrapTextChildren } from "./wrap-text-children";

const wrap = (text: string, key: string): ReactElement => createElement("title", { key }, text);

describe("wrapTextChildren", () => {
	test("hands a single element back as the same element, not a one-item array or a re-keyed copy", () => {
		const child = createElement("view");
		expect(wrapTextChildren(child, wrap)).toBe(child);
	});

	test("a single element survives Children.only — the check Pressable asChild makes", () => {
		const result = wrapTextChildren(createElement("view"), wrap);
		expect(() => Children.only(result)).not.toThrow();
	});

	test("with asChild, hands the child back untouched", () => {
		const child = createElement("view");
		const result = wrapTextChildren(child, wrap, { asChild: true });
		expect(result).toBe(child);
		expect(() => Children.only(result)).not.toThrow();
	});

	test("with asChild, never wraps text — the caller's child is what takes the props", () => {
		expect(wrapTextChildren("Wi-Fi", wrap, { asChild: true })).toBe("Wi-Fi");
	});

	test("with asChild, leaves a one-item array alone rather than unwrapping it", () => {
		const children = [createElement("view", { key: "a" })];
		expect(wrapTextChildren(children, wrap, { asChild: true })).toBe(children);
	});

	test("wraps a lone string in one element", () => {
		const result = wrapTextChildren("Wi-Fi", wrap);
		expect(Array.isArray(result)).toBe(false);
		expect(isValidElement(result) && result.type).toBe("title");
	});

	test("wraps a lone number", () => {
		const result = wrapTextChildren(3, wrap);
		expect(isValidElement(result) && (result.props as { children: string }).children).toBe("3");
	});

	test("collapses consecutive strings and numbers into one run", () => {
		const result = wrapTextChildren(["Row ", 3], wrap);
		expect(isValidElement(result)).toBe(true);
		expect(isValidElement(result) && (result.props as { children: string }).children).toBe("Row 3");
	});

	test("wraps each run of text in mixed children and keeps the elements between them", () => {
		const result = wrapTextChildren(["Wi-Fi", createElement("view", { key: "switch" }), "On"], wrap);
		expect(Array.isArray(result)).toBe(true);
		const items = Children.toArray(result);
		expect(items).toHaveLength(3);
		expect(items.map((item) => isValidElement(item) && item.type)).toEqual(["title", "view", "title"]);
	});

	test("a single element among skipped nodes comes back alone", () => {
		const result = wrapTextChildren([null, createElement("view", { key: "a" }), false], wrap);
		expect(Array.isArray(result)).toBe(false);
		expect(() => Children.only(result)).not.toThrow();
	});

	test("returns nothing for no children", () => {
		expect(Children.count(wrapTextChildren(undefined, wrap))).toBe(0);
	});
});
