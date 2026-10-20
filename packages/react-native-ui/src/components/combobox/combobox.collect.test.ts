import { describe, expect, test } from "bun:test";
import { createElement, Fragment } from "react";
import { collectComboboxOptions } from "./combobox.collect";
import { ComboboxGroup } from "./combobox-group";
import { ComboboxItem } from "./combobox-item";

/** Stands in for `Combobox.Trigger`, which renders React Native and cannot load under `bun test`. */
function ComboboxTrigger(): null {
	return null;
}

describe("collectComboboxOptions", () => {
	test("reads items in order, keywords included", () => {
		const children = [
			createElement(ComboboxItem, { key: "a", keywords: ["NZ"], label: "New Zealand", value: "nz" }),
			createElement(ComboboxItem, { key: "b", label: "Australia", value: "au" }),
		];
		expect(collectComboboxOptions(children)).toEqual([
			{ keywords: ["NZ"], label: "New Zealand", value: "nz" },
			{ label: "Australia", value: "au" },
		]);
	});

	test("reads groups, through fragments", () => {
		const children = createElement(
			Fragment,
			null,
			createElement(
				ComboboxGroup,
				{ label: "Fruit" },
				createElement(ComboboxItem, { isDisabled: true, label: "Fig", value: "fig" }),
				createElement(
					Fragment,
					null,
					createElement(ComboboxItem, { description: "Gold", label: "Kiwi", value: "kiwi" })
				)
			)
		);
		expect(collectComboboxOptions(children)).toEqual([
			{
				label: "Fruit",
				options: [
					{ isDisabled: true, label: "Fig", value: "fig" },
					{ description: "Gold", label: "Kiwi", value: "kiwi" },
				],
			},
		]);
	});

	test("children become the row's content", () => {
		const content = createElement("span", null, "custom");
		const [option] = collectComboboxOptions(createElement(ComboboxItem, { label: "Fig", value: "fig" }, content));
		expect(option).toEqual({ content, label: "Fig", value: "fig" });
	});

	test("skips anything that is neither an item nor a group", () => {
		const children = [
			createElement(ComboboxTrigger, { key: "t" }),
			"text",
			null,
			createElement(ComboboxItem, { key: "a", label: "Apple", value: "a" }),
		];
		expect(collectComboboxOptions(children)).toEqual([{ label: "Apple", value: "a" }]);
	});
});
