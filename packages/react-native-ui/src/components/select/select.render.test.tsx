import { describe, expect, jest, test } from "@jest/globals";
import { type ReactElement, type ReactNode, useState } from "react";
import { fireEvent, renderWithProviders, screen, waitFor } from "../../test/render";
import { BottomSheetProvider } from "../bottom-sheet";
import { Button } from "../button";
import { Field } from "../field";
import { Text } from "../text";
import { Select, type SelectProps } from "./select";

/** The app mounts `BottomSheetProvider` once; the sheet's portal needs it. */
function Sheets({ children }: { children: ReactNode }): ReactElement {
	return <BottomSheetProvider>{children}</BottomSheetProvider>;
}

const OPTIONS = [
	{ label: "Designer", value: "designer" },
	{ label: "Engineer", value: "engineer" },
	{ label: "Manager", value: "pm", isDisabled: true },
] as const;

const tap = (element: Parameters<typeof fireEvent>[0]) => fireEvent(element, "accessibilityTap");
const trigger = (name = "Choose") => screen.getByRole("button", { name });
const valueText = () => trigger().props.accessibilityValue?.text;
const openSheet = async (name?: string) => tap(trigger(name));

function renderSelect(props: SelectProps = {}) {
	return renderWithProviders(<Select options={OPTIONS} placeholder="Choose" testID="select" {...props} />, {
		wrapper: Sheets,
	});
}

describe("Select trigger", () => {
	test("is a button named by the placeholder, collapsed, with an empty value", async () => {
		await renderSelect();
		expect(trigger()).toBeOnTheScreen();
		expect(trigger()).not.toBeExpanded();
		expect(valueText()).toBe("");
		expect(trigger().props.accessibilityHint).toBe("Opens a list of options");
		expect(screen.getByText("Choose")).toBeOnTheScreen();
	});

	test("shows the chosen label in place of the placeholder", async () => {
		await renderSelect({ defaultValue: "engineer" });
		expect(screen.queryByText("Choose")).not.toBeOnTheScreen();
		expect(screen.getByText("Engineer")).toBeOnTheScreen();
		expect(trigger()).toHaveAccessibilityValue({ text: "Engineer" });
	});

	test("opening it expands the trigger and lists the options", async () => {
		await renderSelect();
		expect(screen.queryByRole("radio", { name: "Designer" })).not.toBeOnTheScreen();
		await openSheet();
		expect(trigger()).toBeExpanded();
		expect(screen.getByRole("radio", { name: "Designer" })).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "Engineer" })).toBeOnTheScreen();
	});

	test("title heads the sheet", async () => {
		await renderSelect({ title: "Your role" });
		await openSheet("Your role");
		expect(screen.getAllByText("Your role").length).toBeGreaterThan(0);
		expect(screen.getByRole("radio", { name: "Designer" })).toBeOnTheScreen();
	});

	test("a disabled select is disabled and never opens", async () => {
		await renderSelect({ isDisabled: true });
		expect(trigger()).toBeDisabled();
		await openSheet();
		expect(screen.queryByRole("radio", { name: "Designer" })).not.toBeOnTheScreen();
		expect(trigger()).not.toBeExpanded();
	});

	test("read-only stays enabled for a screen reader, drops the hint and never opens", async () => {
		await renderSelect({ defaultValue: "designer", isReadOnly: true });
		expect(trigger()).not.toBeDisabled();
		expect(trigger().props.accessibilityHint).toBeUndefined();
		expect(trigger()).toHaveAccessibilityValue({ text: "Designer" });
		await openSheet();
		expect(screen.queryByRole("radio", { name: "Engineer" })).not.toBeOnTheScreen();
	});

	test("a custom Select.Trigger replaces the default one", async () => {
		await renderWithProviders(
			<Select options={OPTIONS} placeholder="Choose">
				<Select.Trigger accessibilityLabel="Role picker">
					<Select.Item label="ignored" value="ignored" />
				</Select.Trigger>
			</Select>,
			{ wrapper: Sheets }
		);
		expect(screen.getByRole("button", { name: "Role picker" })).toBeOnTheScreen();
	});

	test("an enabled select leaves a disabled asChild child disabled and closed", async () => {
		await renderWithProviders(
			<Select options={OPTIONS} placeholder="Choose">
				<Select.Trigger asChild>
					<Button isDisabled>Sort</Button>
				</Select.Trigger>
			</Select>,
			{ wrapper: Sheets }
		);
		const sort = screen.getByRole("button", { name: "Choose" });
		expect(sort).toBeDisabled();
		await tap(sort);
		expect(screen.queryByRole("radio", { name: "Designer" })).not.toBeOnTheScreen();
	});
});

describe("Select single", () => {
	test("rows are radios carrying selected state", async () => {
		await renderSelect({ defaultValue: "engineer" });
		await openSheet();
		expect(screen.getByRole("radio", { name: "Engineer" })).toBeSelected();
		expect(screen.getByRole("radio", { name: "Designer" })).not.toBeSelected();
	});

	test("choosing an option reports its value, updates the trigger and closes the sheet", async () => {
		const onValueChange = jest.fn();
		await renderSelect({ onValueChange });
		await openSheet();
		await tap(screen.getByRole("radio", { name: "Engineer" }));

		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith("engineer");
		expect(trigger()).toHaveAccessibilityValue({ text: "Engineer" });
		await waitFor(() => expect(screen.queryByRole("radio", { name: "Designer" })).not.toBeOnTheScreen());
		expect(trigger()).not.toBeExpanded();
	});

	test("a disabled option is announced disabled and cannot be chosen", async () => {
		const onValueChange = jest.fn();
		await renderSelect({ onValueChange });
		await openSheet();
		const disabled = screen.getByRole("radio", { name: "Manager" });
		expect(disabled).toBeDisabled();
		await tap(disabled);
		expect(onValueChange).not.toHaveBeenCalled();
		expect(screen.getByRole("radio", { name: "Designer" })).toBeOnTheScreen();
	});

	test("pressing the chosen row again keeps it and closes, without reporting", async () => {
		const onValueChange = jest.fn();
		await renderSelect({ defaultValue: "designer", onValueChange });
		await openSheet();
		await tap(screen.getByRole("radio", { name: "Designer" }));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(trigger()).toHaveAccessibilityValue({ text: "Designer" });
		await waitFor(() => expect(screen.queryByRole("radio", { name: "Engineer" })).not.toBeOnTheScreen());
	});

	test("isClearable: pressing the chosen row clears it and reports null", async () => {
		const onValueChange = jest.fn();
		await renderSelect({ defaultValue: "designer", isClearable: true, onValueChange });
		await openSheet();
		await tap(screen.getByRole("radio", { name: "Designer" }));
		expect(onValueChange).toHaveBeenCalledWith(null);
		expect(valueText()).toBe("");
		expect(screen.getByText("Choose")).toBeOnTheScreen();
	});

	test("uncontrolled: defaultValue seeds it and it changes itself", async () => {
		await renderSelect({ defaultValue: "designer" });
		expect(trigger()).toHaveAccessibilityValue({ text: "Designer" });
		await openSheet();
		await tap(screen.getByRole("radio", { name: "Engineer" }));
		expect(trigger()).toHaveAccessibilityValue({ text: "Engineer" });
	});

	test("controlled: reports the pick and waits for the prop", async () => {
		const onValueChange = jest.fn();
		const view = await renderSelect({ onValueChange, value: "designer" });
		await openSheet();
		await tap(screen.getByRole("radio", { name: "Engineer" }));
		expect(onValueChange).toHaveBeenCalledWith("engineer");
		expect(trigger()).toHaveAccessibilityValue({ text: "Designer" });

		await view.rerender(
			<Select onValueChange={onValueChange} options={OPTIONS} placeholder="Choose" testID="select" value="engineer" />
		);
		expect(trigger()).toHaveAccessibilityValue({ text: "Engineer" });
	});

	test("controlled null shows the placeholder", async () => {
		await renderSelect({ value: null });
		expect(screen.getByText("Choose")).toBeOnTheScreen();
	});

	test("a state owner closes the loop through onValueChange", async () => {
		function Owner(): ReactElement {
			const [value, setValue] = useState<string | null>(null);
			return <Select onValueChange={setValue} options={OPTIONS} placeholder="Choose" value={value} />;
		}
		await renderWithProviders(<Owner />, { wrapper: Sheets });
		await openSheet();
		await tap(screen.getByRole("radio", { name: "Designer" }));
		expect(trigger()).toHaveAccessibilityValue({ text: "Designer" });
	});

	test("a description joins the row's accessible name", async () => {
		await renderSelect({ options: [{ description: "Ships things", label: "Engineer", value: "engineer" }] });
		await openSheet();
		expect(screen.getByRole("radio", { name: "Engineer, Ships things" })).toBeOnTheScreen();
	});

	test("an empty list says so, and emptyText overrides it", async () => {
		await renderSelect({ emptyText: "Nothing here", options: [] });
		await openSheet();
		expect(screen.getByText("Nothing here")).toBeOnTheScreen();
	});
});

describe("Select multiple", () => {
	test("rows are checkboxes; a pick reports the array and keeps the sheet open", async () => {
		const onValueChange = jest.fn();
		await renderSelect({ onValueChange, selectionMode: "multiple" });
		await openSheet();
		await tap(screen.getByRole("checkbox", { name: "Designer" }));

		expect(onValueChange).toHaveBeenLastCalledWith(["designer"]);
		expect(screen.getByRole("checkbox", { name: "Designer" })).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Engineer" })).not.toBeChecked();

		await tap(screen.getByRole("checkbox", { name: "Engineer" }));
		expect(onValueChange).toHaveBeenLastCalledWith(["designer", "engineer"]);
		expect(trigger()).toBeExpanded();
	});

	test("pressing a chosen row deselects it", async () => {
		const onValueChange = jest.fn();
		await renderSelect({ defaultValue: ["designer", "engineer"], onValueChange, selectionMode: "multiple" });
		await openSheet();
		await tap(screen.getByRole("checkbox", { name: "Designer" }));
		expect(onValueChange).toHaveBeenLastCalledWith(["engineer"]);
	});

	test("Done closes the sheet", async () => {
		await renderSelect({ selectionMode: "multiple" });
		await openSheet();
		await tap(screen.getByRole("button", { name: "Done" }));
		await waitFor(() => expect(screen.queryByRole("checkbox", { name: "Designer" })).not.toBeOnTheScreen());
		expect(trigger()).not.toBeExpanded();
	});

	test("doneText renames the footer button", async () => {
		await renderSelect({ doneText: "Apply", selectionMode: "multiple" });
		await openSheet();
		expect(screen.getByRole("button", { name: "Apply" })).toBeOnTheScreen();
	});

	test("the trigger joins labels up to maxLabels, then shows a count", async () => {
		await renderSelect({ defaultValue: ["designer", "engineer"], selectionMode: "multiple" });
		expect(trigger()).toHaveAccessibilityValue({ text: "Designer, Engineer" });

		await screen.unmount();
		await renderSelect({
			defaultValue: ["designer", "engineer"],
			maxLabels: 1,
			selectionMode: "multiple",
		});
		expect(trigger()).toHaveAccessibilityValue({ text: "2 selected" });
	});

	test("formatSelectedCount words the count", async () => {
		await renderSelect({
			defaultValue: ["designer", "engineer"],
			formatSelectedCount: (count) => `${count} roles`,
			maxLabels: 1,
			selectionMode: "multiple",
		});
		expect(trigger()).toHaveAccessibilityValue({ text: "2 roles" });
	});

	test("maxSelected disables the unchosen rows, never a chosen one, and says why", async () => {
		const onValueChange = jest.fn();
		await renderSelect({
			defaultValue: ["designer"],
			maxSelected: 1,
			onValueChange,
			options: [
				{ label: "Designer", value: "designer" },
				{ label: "Engineer", value: "engineer" },
			],
			selectionMode: "multiple",
		});
		await openSheet();
		expect(screen.getByRole("checkbox", { name: "Designer" })).toBeEnabled();
		const blocked = screen.getByRole("checkbox", { name: "Engineer, Limit reached" });
		expect(blocked).toBeDisabled();
		await tap(blocked);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test("limitReachedText overrides the explanation", async () => {
		await renderSelect({
			defaultValue: ["designer"],
			limitReachedText: "Full",
			maxSelected: 1,
			options: [
				{ label: "Designer", value: "designer" },
				{ label: "Engineer", value: "engineer" },
			],
			selectionMode: "multiple",
		});
		await openSheet();
		expect(screen.getByRole("checkbox", { name: "Engineer, Full" })).toBeDisabled();
	});

	test("controlled: reports and waits for the prop", async () => {
		const onValueChange = jest.fn();
		const view = await renderSelect({ onValueChange, selectionMode: "multiple", value: [] });
		await openSheet();
		await tap(screen.getByRole("checkbox", { name: "Engineer" }));
		expect(onValueChange).toHaveBeenCalledWith(["engineer"]);
		expect(screen.getByRole("checkbox", { name: "Engineer" })).not.toBeChecked();

		await view.rerender(
			<Select
				onValueChange={onValueChange}
				options={OPTIONS}
				placeholder="Choose"
				selectionMode="multiple"
				testID="select"
				value={["engineer"]}
			/>
		);
		expect(screen.getByRole("checkbox", { name: "Engineer" })).toBeChecked();
	});
});

describe("Select declarative children", () => {
	test("Select.Item and Select.Group draw rows and group headings", async () => {
		await renderWithProviders(
			<Select placeholder="Choose">
				<Select.Group label="Oceania">
					<Select.Item label="New Zealand" value="nz" />
					<Select.Item description="Includes territories" label="Australia" value="au" />
				</Select.Group>
				<Select.Item label="Elsewhere" value="else" />
			</Select>,
			{ wrapper: Sheets }
		);
		await openSheet();
		expect(screen.getByRole("header", { name: "Oceania" })).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "New Zealand" })).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "Australia, Includes territories" })).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "Elsewhere" })).toBeOnTheScreen();
	});

	test("Select.Item renders nothing where it is written", async () => {
		await renderWithProviders(
			<Select placeholder="Choose">
				<Select.Item label="New Zealand" value="nz" />
			</Select>,
			{ wrapper: Sheets }
		);
		expect(screen.queryByText("New Zealand")).not.toBeOnTheScreen();
	});
});

describe("Select search", () => {
	const countries = [
		{ label: "Austria", value: "at" },
		{ label: "Australia", value: "au" },
		{ label: "Zurich", value: "ch" },
	];

	test("a searchable sheet filters rows as you type and says when nothing matches", async () => {
		await renderSelect({ isSearchable: true, options: countries, searchPlaceholder: "Find" });
		await openSheet();
		const search = screen.getByLabelText("Find");
		await fireEvent.changeText(search, "aus");
		expect(screen.getByRole("radio", { name: "Austria" })).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "Australia" })).toBeOnTheScreen();
		expect(screen.queryByRole("radio", { name: "Zurich" })).not.toBeOnTheScreen();

		await fireEvent.changeText(search, "qqq");
		expect(screen.getByText("No results")).toBeOnTheScreen();
	});

	test("search folds case and accents", async () => {
		await renderSelect({ isSearchable: true, options: [{ label: "Österreich", value: "at" }] });
		await openSheet();
		await fireEvent.changeText(screen.getByLabelText("Search"), "OSTER");
		expect(screen.getByRole("radio", { name: "Österreich" })).toBeOnTheScreen();
	});

	test("a non-searchable sheet has no search field", async () => {
		await renderSelect({ options: countries });
		await openSheet();
		expect(screen.queryByLabelText("Search")).not.toBeOnTheScreen();
	});

	test("the query clears when the sheet closes", async () => {
		await renderSelect({ isSearchable: true, options: countries });
		await openSheet();
		await fireEvent.changeText(screen.getByLabelText("Search"), "zur");
		await tap(screen.getByRole("radio", { name: "Zurich" }));
		await waitFor(() => expect(screen.queryByLabelText("Search")).not.toBeOnTheScreen());
		await openSheet();
		expect(screen.getByRole("radio", { name: "Austria" })).toBeOnTheScreen();
	});
});

describe("Select states", () => {
	test("isLoading swaps the chevron for a spinner and still opens", async () => {
		await renderSelect({ isLoading: true, options: [] });
		await openSheet();
		expect(trigger()).toBeExpanded();
	});

	test("renderValue draws a non-empty selection, not the placeholder text", async () => {
		await renderSelect({
			defaultValue: "designer",
			renderValue: (selected) => <Text>{`Custom ${selected[0]?.label}`}</Text>,
		});
		expect(screen.getByText("Custom Designer")).toBeOnTheScreen();
	});
});

describe("Select in a Field", () => {
	test("takes its name from Field.Label and opens when the label is tapped", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Role</Field.Label>
				<Select options={OPTIONS} placeholder="Choose" />
			</Field>,
			{ wrapper: Sheets }
		);
		expect(screen.getByRole("button", { name: "Role" })).toBeOnTheScreen();
		await tap(screen.getByText("Role"));
		expect(screen.getByRole("button", { name: "Role" })).toBeExpanded();
		expect(screen.getByRole("radio", { name: "Designer" })).toBeOnTheScreen();
	});

	test("inherits disabled from the Field, and an explicit false opts out", async () => {
		await renderWithProviders(
			<Field isDisabled>
				<Field.Label>Inherited</Field.Label>
				<Select options={OPTIONS} placeholder="Choose" />
			</Field>,
			{ wrapper: Sheets }
		);
		expect(screen.getByRole("button", { name: "Inherited" })).toBeDisabled();
		await screen.unmount();

		await renderWithProviders(
			<Field isDisabled>
				<Field.Label>Opted out</Field.Label>
				<Select isDisabled={false} options={OPTIONS} placeholder="Choose" />
			</Field>,
			{ wrapper: Sheets }
		);
		expect(screen.getByRole("button", { name: "Opted out" }).props.accessibilityState.disabled).toBe(false);
	});

	test("the Field.Label text titles the sheet", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Role</Field.Label>
				<Select options={OPTIONS} placeholder="Choose" />
			</Field>,
			{ wrapper: Sheets }
		);
		await openSheet("Role");
		expect(screen.getAllByText("Role").length).toBeGreaterThan(1);
	});
});

describe("Select parts outside a root", () => {
	test("Select.Trigger throws outside a Select", async () => {
		const original = console.error;
		console.error = () => undefined;
		try {
			await expect(renderWithProviders(<Select.Trigger />)).rejects.toThrow(
				"Select.Trigger must be rendered inside a <Select>."
			);
		} finally {
			console.error = original;
		}
	});
});
