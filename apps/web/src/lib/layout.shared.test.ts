import { describe, expect, test } from "bun:test";
import { baseOptions, homeOptions } from "./layout.shared";

function linkTexts(options: ReturnType<typeof baseOptions>): unknown[] {
	return (options.links ?? []).map((link) => ("text" in link ? link.text : null));
}

describe("the header's links", () => {
	test("the docs header carries every namespace", () => {
		expect(linkTexts(baseOptions())).toEqual(["Docs", "Components", "Charts", "Bottom Sheet", "Theme"]);
	});

	test("the home header carries three", () => {
		expect(linkTexts(homeOptions())).toEqual(["Docs", "Components", "Theme"]);
	});
});
