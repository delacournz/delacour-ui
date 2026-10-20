import { describe, expect, test } from "bun:test";
import { createElement, Fragment } from "react";
import { collectOptions, findChildOfType } from "./select.collect";
import { SelectGroup } from "./select-group";
import { SelectItem } from "./select-item";

/** Stands in for `Select.Trigger`, which renders React Native and cannot load under `bun test`. */
function SelectTrigger(): null {
	return null;
}

describe("collectOptions", () => {
	test("reads items in order, as options", () => {
		const children = [
			createElement(SelectItem, { key: "a", label: "Apple", value: "a" }),
			createElement(SelectItem, { description: "Yellow", isDisabled: true, key: "b", label: "Banana", value: "b" }),
		];
		expect(collectOptions(children)).toEqual([
			{ label: "Apple", value: "a" },
			{ description: "Yellow", isDisabled: true, label: "Banana", value: "b" },
		]);
	});

	test("reads a group's items under its label", () => {
		const children = createElement(
			SelectGroup,
			{ label: "Fruit" },
			createElement(SelectItem, { label: "Apple", value: "a" }),
			createElement(SelectItem, { label: "Banana", value: "b" })
		);
		expect(collectOptions(children)).toEqual([
			{
				label: "Fruit",
				options: [
					{ label: "Apple", value: "a" },
					{ label: "Banana", value: "b" },
				],
			},
		]);
	});

	test("looks through fragments and arrays, the way a .map() writes them", () => {
		const children = createElement(
			Fragment,
			null,
			["a", "b"].map((value) => createElement(SelectItem, { key: value, label: value.toUpperCase(), value }))
		);
		expect(collectOptions(children).map((option) => ("value" in option ? option.value : ""))).toEqual(["a", "b"]);
	});

	test("carries what only an item can say — icon, className and custom content", () => {
		const content = createElement("span", null, "Custom");
		const [option] = collectOptions(createElement(SelectItem, { className: "px-8", label: "A", value: "a" }, content));
		expect(option).toEqual({ className: "px-8", content, label: "A", value: "a" });
	});

	test("ignores anything that is not an item or a group", () => {
		const children = [
			"text",
			null,
			false,
			createElement(SelectTrigger, { key: "t" }),
			createElement(SelectItem, { key: "a", label: "A", value: "a" }),
		];
		expect(collectOptions(children)).toEqual([{ label: "A", value: "a" }]);
	});
});

describe("findChildOfType", () => {
	test("finds a composed trigger among the children", () => {
		const trigger = createElement(SelectTrigger, { key: "t" });
		expect(
			findChildOfType([createElement(SelectItem, { key: "a", label: "A", value: "a" }), trigger], SelectTrigger)?.type
		).toBe(SelectTrigger);
	});

	test("is null when there is none", () => {
		expect(findChildOfType(createElement(SelectItem, { label: "A", value: "a" }), SelectTrigger)).toBeNull();
	});
});
