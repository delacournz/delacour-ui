import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { fireEvent, renderWithProviders, screen, within } from "../../test/render";
import { BottomSheetProvider } from "../bottom-sheet";
import { Field } from "../field";
import { Pressable } from "../pressable";
import { Combobox, type ComboboxMultipleProps, type ComboboxProps, type ComboboxSingleProps } from "./combobox";

function Sheets({ children }: { children: ReactNode }): ReactElement {
	return <BottomSheetProvider>{children}</BottomSheetProvider>;
}

const OPTIONS = [
	{ label: "Australia", value: "au" },
	{ label: "Canada", value: "ca" },
	{ label: "Fiji", value: "fj" },
	{ isDisabled: true, label: "Narnia", value: "nn" },
	{ label: "New Zealand", value: "nz" },
] as const;

function render(props: Partial<ComboboxSingleProps> | Partial<ComboboxMultipleProps> = {}) {
	return renderWithProviders(
		<Combobox
			options={OPTIONS}
			placeholder="Choose a country"
			testID="cb"
			title="Country"
			{...(props as ComboboxProps)}
		/>,
		{ wrapper: Sheets }
	);
}

const press = (el: ReturnType<typeof screen.getByRole>) => fireEvent(el, "accessibilityTap");
const trigger = () => screen.getByRole("button", { name: "Country" });
const search = () => screen.getByLabelText("Search");
const open = async () => {
	await press(trigger());
};

describe("Combobox", () => {
	test("the trigger is a collapsed button named by title, holding the placeholder", async () => {
		await render();
		expect(trigger()).toBeOnTheScreen();
		expect(trigger()).toBeCollapsed();
		expect(screen.getByText("Choose a country")).toBeOnTheScreen();
		expect(screen.queryByLabelText("Search")).not.toBeOnTheScreen();
	});

	test("opening shows the search field and a radio per option", async () => {
		await render();
		await open();
		expect(trigger()).toBeExpanded();
		expect(search()).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "Australia" })).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "Australia" })).not.toBeSelected();
		expect(screen.getAllByRole("radio")).toHaveLength(5);
	});

	test("typing filters the options, reporting each change as a type", async () => {
		const onInputValueChange = jest.fn();
		await render({ onInputValueChange });
		await open();
		await fireEvent.changeText(search(), "new");
		expect(onInputValueChange).toHaveBeenLastCalledWith("new", "type");
		expect(screen.getAllByRole("radio")).toHaveLength(1);
		expect(screen.getByRole("radio", { name: "New Zealand" })).toBeOnTheScreen();
		expect(screen.queryByRole("radio", { name: "Fiji" })).not.toBeOnTheScreen();
	});

	test("filtering folds case and accents", async () => {
		await renderWithProviders(
			<Combobox
				options={[
					{ label: "Éclair", value: "e" },
					{ label: "Tart", value: "t" },
				]}
				title="Pastry"
			/>,
			{ wrapper: Sheets }
		);
		await press(screen.getByRole("button", { name: "Pastry" }));
		await fireEvent.changeText(screen.getByLabelText("Search"), "ECL");
		expect(screen.getAllByRole("radio")).toHaveLength(1);
		expect(screen.getByRole("radio", { name: "Éclair" })).toBeOnTheScreen();
	});

	test("filter none leaves the options as given", async () => {
		await render({ filter: { kind: "none" } });
		await open();
		await fireEvent.changeText(search(), "zzz");
		expect(screen.getAllByRole("radio")).toHaveLength(5);
	});

	test("a custom filter decides which options show", async () => {
		await render({ filter: { kind: "custom", match: (option, query) => option.value === query } });
		await open();
		await fireEvent.changeText(search(), "fj");
		expect(screen.getAllByRole("radio")).toHaveLength(1);
		expect(screen.getByRole("radio", { name: "Fiji" })).toBeOnTheScreen();
	});

	test("a query that matches nothing shows the empty text", async () => {
		await render();
		await open();
		await fireEvent.changeText(search(), "zzz");
		expect(screen.queryByRole("radio")).not.toBeOnTheScreen();
		expect(screen.getByText("No results")).toBeOnTheScreen();
	});

	test("emptyText replaces the default empty line", async () => {
		await render({ emptyText: "Nothing here" });
		await open();
		await fireEvent.changeText(search(), "zzz");
		expect(screen.getByText("Nothing here")).toBeOnTheScreen();
	});

	test("Combobox.Empty replaces the empty line", async () => {
		await renderWithProviders(
			<Combobox options={OPTIONS} title="Country">
				<Combobox.Empty>Try another spelling</Combobox.Empty>
			</Combobox>,
			{ wrapper: Sheets }
		);
		await press(screen.getByRole("button", { name: "Country" }));
		await fireEvent.changeText(screen.getByLabelText("Search"), "zzz");
		expect(screen.getByText("Try another spelling")).toBeOnTheScreen();
		expect(screen.queryByText("No results")).not.toBeOnTheScreen();
	});

	test("Combobox.Item and Combobox.Group children declare the options", async () => {
		await renderWithProviders(
			<Combobox title="Pick">
				<Combobox.Group label="Oceania">
					<Combobox.Item label="Fiji" value="fj" />
				</Combobox.Group>
				<Combobox.Item label="Canada" value="ca" />
			</Combobox>,
			{ wrapper: Sheets }
		);
		await press(screen.getByRole("button", { name: "Pick" }));
		expect(screen.getByRole("header", { name: "Oceania" })).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "Fiji" })).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "Canada" })).toBeOnTheScreen();
	});

	test("choosing an option reports it, closes the sheet and shows it on the trigger", async () => {
		const onValueChange = jest.fn();
		await render({ onValueChange });
		await open();
		await press(screen.getByRole("radio", { name: "Fiji" }));
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith("fj");
		expect(screen.queryByLabelText("Search")).not.toBeOnTheScreen();
		expect(trigger()).toBeCollapsed();
		expect(trigger()).toHaveAccessibilityValue({ text: "Fiji" });
		expect(within(trigger()).getByText("Fiji")).toBeOnTheScreen();
	});

	test("the chosen option is marked selected when the sheet reopens", async () => {
		await render({ defaultValue: "ca" });
		await open();
		expect(screen.getByRole("radio", { name: "Canada" })).toBeSelected();
		expect(screen.getByRole("radio", { name: "Fiji" })).not.toBeSelected();
	});

	test("a pick empties the query and reports why", async () => {
		const onInputValueChange = jest.fn();
		await render({ onInputValueChange });
		await open();
		await fireEvent.changeText(search(), "fi");
		await press(screen.getByRole("radio", { name: "Fiji" }));
		expect(onInputValueChange).toHaveBeenLastCalledWith("", "select");
		await open();
		expect(search()).toHaveDisplayValue("");
		expect(screen.getAllByRole("radio")).toHaveLength(5);
	});

	test("a disabled option is disabled and cannot be chosen", async () => {
		const onValueChange = jest.fn();
		await render({ onValueChange });
		await open();
		const row = screen.getByRole("radio", { name: "Narnia" });
		expect(row).toBeDisabled();
		await press(row);
		expect(onValueChange).not.toHaveBeenCalled();
		expect(screen.getByLabelText("Search")).toBeOnTheScreen();
	});

	test("uncontrolled: defaultValue seeds the trigger and a pick changes it", async () => {
		await render({ defaultValue: "au" });
		expect(trigger()).toHaveAccessibilityValue({ text: "Australia" });
		await open();
		await press(screen.getByRole("radio", { name: "Canada" }));
		expect(trigger()).toHaveAccessibilityValue({ text: "Canada" });
	});

	test("controlled: a pick reports and waits for the value prop", async () => {
		const onValueChange = jest.fn();
		const view = await render({ onValueChange, value: "au" });
		await open();
		await press(screen.getByRole("radio", { name: "Canada" }));
		expect(onValueChange).toHaveBeenCalledWith("ca");
		expect(trigger()).toHaveAccessibilityValue({ text: "Australia" });

		await view.rerender(<Combobox options={OPTIONS} placeholder="Choose a country" title="Country" value="ca" />);
		expect(trigger()).toHaveAccessibilityValue({ text: "Canada" });
	});

	test("choosing the chosen option again keeps it unless isClearable", async () => {
		const onValueChange = jest.fn();
		await render({ defaultValue: "au", onValueChange });
		await open();
		await press(screen.getByRole("radio", { name: "Australia" }));
		expect(onValueChange).not.toHaveBeenCalledWith(null);
		expect(trigger()).toHaveAccessibilityValue({ text: "Australia" });
	});

	test("controlled inputValue shows the prop and reports typing", async () => {
		const onInputValueChange = jest.fn();
		const view = await render({ inputValue: "ca", onInputValueChange });
		await open();
		expect(search()).toHaveDisplayValue("ca");
		expect(screen.getAllByRole("radio")).toHaveLength(1);

		await fireEvent.changeText(search(), "fiji");
		expect(onInputValueChange).toHaveBeenLastCalledWith("fiji", "type");
		expect(search()).toHaveDisplayValue("ca");

		await view.rerender(
			<Combobox inputValue="fiji" options={OPTIONS} placeholder="Choose a country" title="Country" />
		);
		expect(search()).toHaveDisplayValue("fiji");
		expect(screen.getAllByRole("radio")).toHaveLength(1);
	});

	test("defaultInputValue seeds the query", async () => {
		await render({ defaultInputValue: "fij" });
		await open();
		expect(search()).toHaveDisplayValue("fij");
		expect(screen.getAllByRole("radio")).toHaveLength(1);
	});

	test("the search field's clear button empties the query", async () => {
		const onInputValueChange = jest.fn();
		await render({ onInputValueChange });
		await open();
		expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeOnTheScreen();
		await fireEvent.changeText(search(), "fi");
		await press(screen.getByRole("button", { name: "Clear search" }));
		expect(onInputValueChange).toHaveBeenLastCalledWith("", "clear");
		expect(search()).toHaveDisplayValue("");
	});

	test("closing the sheet empties the query and reports a close", async () => {
		const onInputValueChange = jest.fn();
		await render({ onInputValueChange });
		await open();
		await fireEvent.changeText(search(), "fi");
		await press(screen.getByRole("button", { name: "Close" }));
		expect(onInputValueChange).toHaveBeenLastCalledWith("", "close");
		expect(screen.queryByLabelText("Search")).not.toBeOnTheScreen();
	});

	test("isClearable shows a Clear button that empties the value", async () => {
		const onValueChange = jest.fn();
		await render({ defaultValue: "fj", isClearable: true, onValueChange });
		await press(screen.getByRole("button", { name: "Clear" }));
		expect(onValueChange).toHaveBeenCalledWith(null);
		expect(screen.queryByRole("button", { name: "Clear" })).not.toBeOnTheScreen();
		expect(screen.getByText("Choose a country")).toBeOnTheScreen();
	});

	test("no Clear button without isClearable or without a value", async () => {
		await render({ defaultValue: "fj" });
		expect(screen.queryByRole("button", { name: "Clear" })).not.toBeOnTheScreen();
	});

	test("allowCustomValue offers the typed text and commits it", async () => {
		const onValueChange = jest.fn();
		await render({ allowCustomValue: true, onValueChange });
		await open();
		await fireEvent.changeText(search(), "Atlantis");
		await press(screen.getByRole("button", { name: "Add Atlantis" }));
		expect(onValueChange).toHaveBeenCalledWith("Atlantis");
		expect(trigger()).toHaveAccessibilityValue({ text: "Atlantis" });
	});

	test("no create row without allowCustomValue or for an exact label", async () => {
		await render();
		await open();
		await fireEvent.changeText(search(), "Atlantis");
		expect(screen.queryByRole("button", { name: "Add Atlantis" })).not.toBeOnTheScreen();
	});

	test("createLabel words the create row", async () => {
		await render({ allowCustomValue: true, createLabel: (q) => `Add new ${q}` });
		await open();
		await fireEvent.changeText(search(), "Atlantis");
		expect(screen.getByText("Add new Atlantis")).toBeOnTheScreen();
	});

	test("a disabled combobox is disabled and does not open", async () => {
		await render({ isDisabled: true });
		expect(trigger()).toBeDisabled();
		await open();
		expect(screen.queryByLabelText("Search")).not.toBeOnTheScreen();
		expect(trigger()).toBeCollapsed();
	});

	test("a read-only combobox never opens", async () => {
		await render({ defaultValue: "fj", isReadOnly: true });
		await open();
		expect(screen.queryByLabelText("Search")).not.toBeOnTheScreen();
		expect(trigger()).toHaveAccessibilityValue({ text: "Fiji" });
	});

	test("read-only hides the clear button", async () => {
		await render({ defaultValue: "fj", isClearable: true, isReadOnly: true });
		expect(screen.queryByRole("button", { name: "Clear" })).not.toBeOnTheScreen();
	});

	test("a Field disables it, names it and tapping nothing else is needed", async () => {
		await renderWithProviders(
			<Field isDisabled>
				<Field.Label>Country</Field.Label>
				<Combobox options={OPTIONS} />
			</Field>,
			{ wrapper: Sheets }
		);
		const field = screen.getByRole("button", { name: "Country" });
		expect(field).toBeDisabled();
		await press(field);
		expect(screen.queryByLabelText("Country, Search")).not.toBeOnTheScreen();
	});

	test("inside a Field the search field is named by the label", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Country</Field.Label>
				<Combobox options={OPTIONS} />
			</Field>,
			{ wrapper: Sheets }
		);
		await press(screen.getByRole("button", { name: "Country" }));
		expect(screen.getByLabelText("Country, Search")).toBeOnTheScreen();
	});

	test("searchPlaceholder names the search field", async () => {
		await render({ searchPlaceholder: "Find a country" });
		await open();
		expect(screen.getByLabelText("Find a country")).toBeOnTheScreen();
	});

	test("an asChild trigger takes the open press and the accessibility props", async () => {
		await renderWithProviders(
			<Combobox options={OPTIONS} title="Country">
				<Combobox.Trigger asChild>
					<Pressable />
				</Combobox.Trigger>
			</Combobox>,
			{ wrapper: Sheets }
		);
		await press(screen.getByRole("button", { name: "Country" }));
		expect(screen.getByLabelText("Search")).toBeOnTheScreen();
	});
});

describe("Combobox multiple", () => {
	function multiple(props: Partial<ComboboxProps> = {}) {
		return render({ selectionMode: "multiple", ...props } as Partial<ComboboxProps>);
	}

	test("rows are checkboxes and picking one keeps the sheet open", async () => {
		const onValueChange = jest.fn();
		await multiple({ onValueChange });
		await open();
		await press(screen.getByRole("checkbox", { name: "Australia" }));
		expect(onValueChange).toHaveBeenLastCalledWith(["au"]);
		expect(screen.getByRole("checkbox", { name: "Australia" })).toBeChecked();
		await press(screen.getByRole("checkbox", { name: "Fiji" }));
		expect(onValueChange).toHaveBeenLastCalledWith(["au", "fj"]);
		expect(screen.getByLabelText("Search")).toBeOnTheScreen();
	});

	test("picking a checked row again removes it", async () => {
		const onValueChange = jest.fn();
		await multiple({ defaultValue: ["au", "fj"], onValueChange });
		await open();
		await press(screen.getByRole("checkbox", { name: "Australia" }));
		expect(onValueChange).toHaveBeenLastCalledWith(["fj"]);
	});

	test("Done closes the sheet and the trigger reports the count", async () => {
		await multiple({ defaultValue: ["au", "fj"] });
		await open();
		await press(screen.getByRole("button", { name: "Done" }));
		expect(screen.queryByLabelText("Search")).not.toBeOnTheScreen();
		expect(trigger()).toHaveAccessibilityValue({ text: "2 selected" });
	});

	test("doneText words the footer button", async () => {
		await multiple({ doneText: "Apply" });
		await open();
		expect(screen.getByRole("button", { name: "Apply" })).toBeOnTheScreen();
	});

	test("maxSelected disables the remaining rows", async () => {
		const onValueChange = jest.fn();
		await multiple({ defaultValue: ["au"], maxSelected: 1, onValueChange });
		await open();
		const row = screen.getByRole("checkbox", { name: "Fiji, Limit reached" });
		expect(row).toBeDisabled();
		await press(row);
		expect(onValueChange).not.toHaveBeenCalled();
		expect(screen.getByRole("checkbox", { name: "Australia" })).toBeChecked();
	});

	test("each chosen option is a chip with a remove control", async () => {
		const onValueChange = jest.fn();
		await multiple({ defaultValue: ["au", "fj"], onValueChange });
		await open();
		await press(screen.getByTestId("cb-sheet-remove-au"));
		expect(onValueChange).toHaveBeenLastCalledWith(["fj"]);
		expect(screen.queryByTestId("cb-sheet-chip-au")).not.toBeOnTheScreen();
		expect(screen.getByTestId("cb-sheet-chip-fj")).toBeOnTheScreen();
	});

	test("read-only shows the chips without remove controls", async () => {
		await multiple({ defaultValue: ["au"], isReadOnly: true });
		expect(screen.getByText("Australia")).toBeOnTheScreen();
		expect(screen.queryByTestId("cb-remove-au")).not.toBeOnTheScreen();
	});

	test("clear empties the selection", async () => {
		const onValueChange = jest.fn();
		await multiple({ defaultValue: ["au", "fj"], isClearable: true, onValueChange });
		await press(screen.getByRole("button", { name: "Clear" }));
		expect(onValueChange).toHaveBeenLastCalledWith([]);
	});
});

describe("Combobox parts outside a root", () => {
	let consoleError: typeof console.error;
	beforeEach(() => {
		consoleError = console.error;
		console.error = () => undefined;
	});
	afterEach(() => {
		console.error = consoleError;
	});

	test("Combobox.Trigger throws outside a Combobox", async () => {
		await expect(renderWithProviders(<Combobox.Trigger />)).rejects.toThrow(
			"Combobox.Trigger must be rendered inside a <Combobox>."
		);
	});

	test("Combobox.Empty throws outside a Combobox", async () => {
		await expect(renderWithProviders(<Combobox.Empty>None</Combobox.Empty>)).rejects.toThrow(
			"Combobox.Empty must be rendered inside a <Combobox>."
		);
	});
});
