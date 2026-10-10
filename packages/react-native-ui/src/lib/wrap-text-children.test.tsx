import { describe, expect, test } from "bun:test";
import { createElement, isValidElement, type ReactNode } from "react";
import { wrapTextChildren } from "./wrap-text-children";

/** Renders each run as a marker element, so a test can read back what was wrapped and under which key. */
const mark = (text: string, key: string): ReactNode => createElement("run", { key, text });

/** What a wrapped child is: the text of a run, or the type of an element passed through. */
function describeNode(node: ReactNode): string {
	if (!isValidElement<{ text?: string }>(node)) return String(node);
	return node.type === "run" ? `run:${node.props.text}` : `element:${String(node.type)}`;
}

describe("wrapTextChildren", () => {
	test("wraps a bare string", () => {
		expect(wrapTextChildren("New", mark).map(describeNode)).toEqual(["run:New"]);
	});

	test("wraps a bare number", () => {
		expect(wrapTextChildren(3, mark).map(describeNode)).toEqual(["run:3"]);
	});

	// `{count} left` is one piece of text. Wrapping the parts separately would
	// space them apart by the parent's gap.
	test("collects consecutive strings and numbers into one run", () => {
		expect(wrapTextChildren([3, " left"], mark).map(describeNode)).toEqual(["run:3 left"]);
	});

	test("passes elements through and splits the runs either side of them", () => {
		const children = ["Before", createElement("icon", { key: "icon" }), "After"];
		expect(wrapTextChildren(children, mark).map(describeNode)).toEqual(["run:Before", "element:icon", "run:After"]);
	});

	test("drops what React does not render", () => {
		expect(wrapTextChildren([null, undefined, false, "Kept"], mark).map(describeNode)).toEqual(["run:Kept"]);
		expect(wrapTextChildren(null, mark)).toEqual([]);
	});

	// Two runs in one parent are siblings, so they need different keys.
	test("hands each run a distinct key", () => {
		const keys: string[] = [];
		wrapTextChildren(["a", createElement("icon", { key: "icon" }), "b"], (text, key) => {
			keys.push(key);
			return mark(text, key);
		});
		expect(new Set(keys).size).toBe(2);
	});
});
