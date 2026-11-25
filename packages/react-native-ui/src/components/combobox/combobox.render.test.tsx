import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { LabelsProvider } from "../../hooks/use-labels";
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
const act = (el: ReturnType<typeof screen.getByRole>, actionName: string) =>
	fireEvent(el, "accessibilityAction", { nativeEvent: { actionName } });
const actionNames = (el: ReturnType<typeof screen.getByRole>): string[] =>
	(el.props.accessibilityActions ?? []).map((a: { name: string }) => a.name);
const trigger = () => screen.getByRole("button", { name: /^Country/ });
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

	test("the trigger's name carries the placeholder while it shows, and a value stays in the value", async () => {
		await render();
		expect(screen.getByRole("button", { name: "Country, Choose a country" })).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Country, Choose a country" }).props.accessibilityValue).toBeUndefined();
		await render({ defaultValue: "fj" });
		expect(screen.getByRole("button", { name: "Country" })).toBeOnTheScreen();
	});

	test("a trigger drawn short of the minimum grows vertically with slop; a medium one has none", async () => {
		await render({ size: "sm" });
		expect(trigger()).toHaveProp("hitSlop", { bottom: 4, left: 0, right: 0, top: 4 });
		await render({ size: "md" });
		expect(trigger().props.hitSlop).toBeUndefined();
	});

	test("the trigger is busy while loading", async () => {
		await render({ isLoading: true });
		expect(trigger()).toBeBusy();
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

	test("the title and search stay pinned while the rows scroll", async () => {
		await render();
		await open();
		expect(screen.getByTestId("cb-list")).toHaveProp("stickyHeaderIndices", [0]);
		expect(screen.getByTestId("cb-header")).toBeOnTheScreen();
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
		await press(screen.getByRole("button", { name: /^Country/ }));
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
		expect(actionNames(trigger())).toContain("clear");
		await act(trigger(), "clear");
		expect(onValueChange).toHaveBeenCalledWith(null);
		expect(actionNames(trigger())).not.toContain("clear");
		expect(screen.getByText("Choose a country")).toBeOnTheScreen();
	});

	test("no Clear button without isClearable or without a value", async () => {
		await render({ defaultValue: "fj" });
		expect(screen.queryByTestId("cb-clear", { hidden: true })).not.toBeOnTheScreen();
		expect(actionNames(trigger())).not.toContain("clear");
	});

	test("allowCustomValue offers the typed text and commits it", async () => {
		const onValueChange = jest.fn();
		await render({ allowCustomValue: true, onValueChange });
		await open();
		await fireEvent.changeText(search(), "Atlantis");
		await press(screen.getByRole("button", { name: "Use “Atlantis”" }));
		expect(onValueChange).toHaveBeenCalledWith("Atlantis");
		expect(trigger()).toHaveAccessibilityValue({ text: "Atlantis" });
	});

	test("no create row without allowCustomValue or for an exact label", async () => {
		await render();
		await open();
		await fireEvent.changeText(search(), "Atlantis");
		expect(screen.queryByRole("button", { name: "Use “Atlantis”" })).not.toBeOnTheScreen();
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
		expect(screen.queryByTestId("cb-clear", { hidden: true })).not.toBeOnTheScreen();
		expect(actionNames(trigger())).toEqual([]);
	});

	test("a Field disables it, names it and tapping nothing else is needed", async () => {
		await renderWithProviders(
			<Field isDisabled>
				<Field.Label>Country</Field.Label>
				<Combobox options={OPTIONS} />
			</Field>,
			{ wrapper: Sheets }
		);
		const field = screen.getByRole("button", { name: /^Country/ });
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
		await press(screen.getByRole("button", { name: /^Country/ }));
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
		await press(screen.getByRole("button", { name: /^Country/ }));
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
		expect(screen.getByText("Australia", { hidden: true })).toBeOnTheScreen();
		expect(screen.queryByTestId("cb-remove-au", { hidden: true })).not.toBeOnTheScreen();
		expect(actionNames(trigger())).toEqual([]);
	});

	test("the trigger is one stop: clear and each chip's remove are actions, the drawn controls hidden", async () => {
		const onValueChange = jest.fn();
		await multiple({ defaultValue: ["au", "fj"], isClearable: true, onValueChange });
		expect(actionNames(trigger())).toEqual(expect.arrayContaining(["clear", "remove:au", "remove:fj"]));
		expect(trigger().props.accessibilityActions).toContainEqual({ label: "Remove Fiji", name: "remove:fj" });
		expect(screen.queryByTestId("cb-chip-au")).not.toBeOnTheScreen();
		expect(screen.getByTestId("cb-clear", { hidden: true })).toBeOnTheScreen();
		expect(screen.queryByTestId("cb-clear")).not.toBeOnTheScreen();
		expect(screen.getByTestId("cb-chip-au", { hidden: true })).toBeOnTheScreen();
		await act(trigger(), "remove:fj");
		expect(onValueChange).toHaveBeenLastCalledWith(["au"]);
		expect(actionNames(trigger())).not.toContain("remove:fj");
	});

	test("only drawn chips get a remove action; the +N overflow does not", async () => {
		await multiple({ defaultValue: ["au", "ca", "fj", "nz"], maxVisibleChips: 2 });
		expect(actionNames(trigger())).toEqual(["remove:au"]);
	});

	test("the sheet's chips stay reachable", async () => {
		await multiple({ defaultValue: ["au", "fj"] });
		await open();
		expect(screen.getByLabelText("Remove Australia")).toBeOnTheScreen();
		expect(screen.getByTestId("cb-sheet-chip-au")).toBeOnTheScreen();
	});

	test("clear empties the selection", async () => {
		const onValueChange = jest.fn();
		await multiple({ defaultValue: ["au", "fj"], isClearable: true, onValueChange });
		await act(trigger(), "clear");
		expect(onValueChange).toHaveBeenLastCalledWith([]);
	});
});

describe("Combobox labels", () => {
	const german = {
		clear: "Leeren",
		clearSearch: "Suche leeren",
		done: "Fertig",
		empty: "Keine Treffer",
		moreChips: (count: number) => `${count} weitere`,
		moreChipsShort: (count: number) => `${count} mehr`,
		removeChip: (label: string) => `${label} entfernen`,
		search: "Suchen",
		searchInField: (field: string, search: string) => `${search} in ${field}`,
		selected: (count: number) => `${count} gewählt`,
		triggerHint: "Öffnet eine durchsuchbare Liste",
	};

	test("the labels prop changes the trigger, the search field and the empty text", async () => {
		await render({ defaultValue: "fj", isClearable: true, labels: german });
		expect(screen.getByRole("button", { name: /^Country/ }).props.accessibilityHint).toBe(
			"Öffnet eine durchsuchbare Liste"
		);
		expect(trigger().props.accessibilityActions).toContainEqual({ label: "Leeren", name: "clear" });
		await open();
		await fireEvent.changeText(screen.getByLabelText("Suchen"), "zzz");
		expect(screen.getByText("Keine Treffer")).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Suche leeren" })).toBeOnTheScreen();
	});

	test("the multiple trigger's chips, count and Done read the labels", async () => {
		await render({
			defaultValue: ["au", "ca", "fj", "nz"],
			labels: german,
			maxVisibleChips: 2,
			selectionMode: "multiple",
		});
		expect(screen.getByText("3 mehr", { hidden: true })).toBeOnTheScreen();
		expect(trigger()).toHaveAccessibilityValue({ text: "4 gewählt" });
		await open();
		expect(screen.getByText("Fertig")).toBeOnTheScreen();
		expect(screen.getByLabelText("Australia entfernen")).toBeOnTheScreen();
	});

	test("the field label joins the search name through searchInField", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Country</Field.Label>
				<Combobox labels={german} options={OPTIONS} />
			</Field>,
			{ wrapper: Sheets }
		);
		await press(screen.getByRole("button", { name: /^Country/ }));
		expect(screen.getByLabelText("Suchen in Country")).toBeOnTheScreen();
	});

	test("the create row is named by labels.create, so the name holds the visible text", async () => {
		await render({
			allowCustomValue: true,
			labels: {
				create: (query: string) => `${query} anlegen`,
			},
		});
		await open();
		await fireEvent.changeText(search(), "Atlantis");
		expect(screen.getByRole("button", { name: "Atlantis anlegen" })).toBeOnTheScreen();
		expect(screen.getByText("Atlantis anlegen")).toBeOnTheScreen();
	});

	test("a LabelsProvider changes them too", async () => {
		await renderWithProviders(
			<LabelsProvider labels={{ combobox: german }}>
				<Combobox options={OPTIONS} testID="cb" title="Country" />
			</LabelsProvider>,
			{ wrapper: Sheets }
		);
		await open();
		expect(screen.getByLabelText("Suchen")).toBeOnTheScreen();
	});

	test("the prop wins over the provider, key by key", async () => {
		await renderWithProviders(
			<LabelsProvider labels={{ combobox: german }}>
				<Combobox labels={{ search: "Finden" }} options={OPTIONS} testID="cb" title="Country" />
			</LabelsProvider>,
			{ wrapper: Sheets }
		);
		await open();
		expect(screen.getByLabelText("Finden")).toBeOnTheScreen();
		await fireEvent.changeText(screen.getByLabelText("Finden"), "zzz");
		expect(screen.getByText("Keine Treffer")).toBeOnTheScreen();
	});

	test("an explicit per-string prop still wins over labels", async () => {
		await render({ emptyText: "Nothing", labels: german, searchPlaceholder: "Look up" });
		await open();
		await fireEvent.changeText(screen.getByLabelText("Look up"), "zzz");
		expect(screen.getByText("Nothing")).toBeOnTheScreen();
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
