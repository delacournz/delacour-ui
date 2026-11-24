import { afterEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { AccessibilityInfo, Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { SelectionMode, type SelectionModeProps } from "./selection-mode";
import { useSelectionMode } from "./selection-mode.context";

const IDS = ["a", "b", "c"] as const;

type InboxProps = Partial<Omit<SelectionModeProps, "children">> & {
	onDelete?: (selected: string[]) => void;
	onRowPress?: (id: string) => void;
	disabledIds?: readonly string[];
	isExitOnDelete?: boolean;
};

function Inbox({ onDelete, onRowPress, disabledIds = [], isExitOnDelete = false, ...root }: InboxProps): ReactElement {
	return (
		<SelectionMode values={IDS} {...root}>
			<SelectionMode.Header title="Pick" />
			<SelectionMode.Group>
				{IDS.map((id) => (
					<SelectionMode.Item
						isDisabled={disabledIds.includes(id)}
						key={id}
						onPress={() => onRowPress?.(id)}
						value={id}
					>
						<Text>{`Row ${id}`}</Text>
					</SelectionMode.Item>
				))}
			</SelectionMode.Group>
			<SelectionMode.Bar>
				<SelectionMode.Action isExitOnPress={isExitOnDelete} onPress={(selected) => onDelete?.(selected)}>
					Delete
				</SelectionMode.Action>
			</SelectionMode.Bar>
		</SelectionMode>
	);
}

const tap = (element: Parameters<typeof fireEvent>[0]) => fireEvent(element, "accessibilityTap");
const startSelecting = (element: Parameters<typeof fireEvent>[0]) =>
	fireEvent(element, "accessibilityAction", { nativeEvent: { actionName: "longpress" } });
const checkbox = (id: string) => screen.getByRole("checkbox", { name: `Row ${id}` });

afterEach(() => {
	jest.restoreAllMocks();
});

describe("SelectionMode", () => {
	test("off: rows keep their own press, offer Start selecting, and show no header or bar", async () => {
		const onRowPress = jest.fn();
		await renderWithProviders(<Inbox onRowPress={onRowPress} />);

		expect(screen.queryByRole("checkbox")).not.toBeOnTheScreen();
		expect(screen.queryByLabelText("Stop selecting")).not.toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Delete" })).not.toBeOnTheScreen();

		const first = screen.getByRole("button", { name: "Row a" });
		expect(first.props.accessibilityActions).toEqual([{ label: "Start selecting", name: "longpress" }]);

		await tap(first);
		expect(onRowPress).toHaveBeenCalledWith("a");
	});

	test("the longpress accessibility action turns the mode on with that row picked", async () => {
		const onActiveChange = jest.fn();
		const onSelectedChange = jest.fn();
		await renderWithProviders(<Inbox onActiveChange={onActiveChange} onSelectedChange={onSelectedChange} />);

		await startSelecting(screen.getByRole("button", { name: "Row b" }));

		expect(onActiveChange).toHaveBeenCalledWith(true);
		expect(onSelectedChange).toHaveBeenLastCalledWith(["b"]);
		expect(checkbox("b")).toBeChecked();
		expect(checkbox("a")).not.toBeChecked();
		expect(screen.getByText("Pick · 1 of 3")).toBeOnTheScreen();
	});

	test("on: rows are checkboxes, a press toggles and the row's own handler stays quiet", async () => {
		const onRowPress = jest.fn();
		const onSelectedChange = jest.fn();
		await renderWithProviders(<Inbox defaultActive onRowPress={onRowPress} onSelectedChange={onSelectedChange} />);

		expect(checkbox("a").props.accessibilityHint).toBe("Double-tap to select");
		await tap(checkbox("a"));
		await tap(checkbox("c"));
		expect(onSelectedChange).toHaveBeenLastCalledWith(["a", "c"]);
		expect(checkbox("a")).toBeChecked();
		expect(checkbox("c")).toBeChecked();

		await tap(checkbox("a"));
		expect(onSelectedChange).toHaveBeenLastCalledWith(["c"]);
		expect(checkbox("a")).not.toBeChecked();
		expect(onRowPress).not.toHaveBeenCalled();
	});

	test("a disabled row cannot start the mode, offers no action, and keeps its own press", async () => {
		const onRowPress = jest.fn();
		const onActiveChange = jest.fn();
		await renderWithProviders(<Inbox disabledIds={["a"]} onActiveChange={onActiveChange} onRowPress={onRowPress} />);

		const disabled = screen.getByRole("button", { name: "Row a" });
		expect(disabled.props.accessibilityActions).toEqual([]);
		await startSelecting(disabled);
		expect(onActiveChange).not.toHaveBeenCalled();

		await tap(disabled);
		expect(onRowPress).toHaveBeenCalledWith("a");
	});

	test("a disabled row is announced disabled and never toggles while the mode is on", async () => {
		const onRowPress = jest.fn();
		const onSelectedChange = jest.fn();
		await renderWithProviders(
			<Inbox defaultActive disabledIds={["a"]} onRowPress={onRowPress} onSelectedChange={onSelectedChange} />
		);

		expect(checkbox("a")).toBeDisabled();
		expect(checkbox("b")).not.toBeDisabled();
		await tap(checkbox("a"));
		expect(onSelectedChange).not.toHaveBeenCalled();
		expect(checkbox("a")).not.toBeChecked();
		expect(onRowPress).toHaveBeenCalledWith("a");
	});

	test("a row without an onPress is not a button while the mode is off", async () => {
		await renderWithProviders(
			<SelectionMode>
				<SelectionMode.Item value="x">
					<Text>Plain</Text>
				</SelectionMode.Item>
			</SelectionMode>
		);
		expect(screen.queryByRole("button", { name: "Plain" })).not.toBeOnTheScreen();
		expect(screen.getByText("Plain")).toBeOnTheScreen();
	});

	test("defaultSelected seeds the picks and the header counts them", async () => {
		await renderWithProviders(<Inbox defaultActive defaultSelected={["a", "b"]} />);
		expect(checkbox("a")).toBeChecked();
		expect(checkbox("b")).toBeChecked();
		expect(checkbox("c")).not.toBeChecked();
		expect(screen.getByText("Pick · 2 of 3")).toBeOnTheScreen();
	});

	test("the header says 'n selected' and drops select-all without values", async () => {
		await renderWithProviders(
			<SelectionMode defaultActive defaultSelected={["a"]}>
				<SelectionMode.Header />
			</SelectionMode>
		);
		expect(screen.getByText("1 selected")).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Select all" })).not.toBeOnTheScreen();
	});

	test("isSelectAllHidden drops select-all even with values", async () => {
		await renderWithProviders(
			<SelectionMode defaultActive values={IDS}>
				<SelectionMode.Header isSelectAllHidden />
			</SelectionMode>
		);
		expect(screen.queryByRole("button", { name: "Select all" })).not.toBeOnTheScreen();
	});

	test("select all picks every value, then turns into Deselect all, which clears", async () => {
		const onSelectedChange = jest.fn();
		await renderWithProviders(<Inbox defaultActive onSelectedChange={onSelectedChange} />);

		await tap(screen.getByRole("button", { name: "Select all" }));
		expect(onSelectedChange).toHaveBeenLastCalledWith(["a", "b", "c"]);
		expect(screen.getByText("Pick · 3 of 3")).toBeOnTheScreen();

		await tap(screen.getByRole("button", { name: "Deselect all" }));
		expect(onSelectedChange).toHaveBeenLastCalledWith([]);
		expect(screen.getByText("Pick · 0 of 3")).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Select all" })).toBeOnTheScreen();
	});

	test("max caps toggling and select-all, and a picked row still comes off", async () => {
		const onSelectedChange = jest.fn();
		await renderWithProviders(<Inbox defaultActive max={2} onSelectedChange={onSelectedChange} />);

		await tap(checkbox("a"));
		await tap(checkbox("b"));
		onSelectedChange.mockClear();
		await tap(checkbox("c"));
		expect(onSelectedChange).not.toHaveBeenCalled();
		expect(checkbox("c")).not.toBeChecked();
		expect(screen.getByRole("button", { name: "Deselect all" })).toBeOnTheScreen();

		await tap(checkbox("a"));
		expect(onSelectedChange).toHaveBeenLastCalledWith(["b"]);
	});

	test("max limits select-all to the cap", async () => {
		const onSelectedChange = jest.fn();
		await renderWithProviders(<Inbox defaultActive max={2} onSelectedChange={onSelectedChange} />);
		await tap(screen.getByRole("button", { name: "Select all" }));
		expect(onSelectedChange).toHaveBeenLastCalledWith(["a", "b"]);
	});

	test("the bar is hidden until something is picked, then hands actions the selection", async () => {
		const onDelete = jest.fn();
		await renderWithProviders(<Inbox defaultActive onDelete={onDelete} />);
		expect(screen.queryByRole("button", { name: "Delete" })).not.toBeOnTheScreen();

		await tap(checkbox("b"));
		await tap(checkbox("a"));
		await tap(screen.getByRole("button", { name: "Delete" }));
		expect(onDelete).toHaveBeenCalledWith(["b", "a"]);
		expect(screen.getByRole("button", { name: "Delete" })).toBeOnTheScreen();
		expect(checkbox("a")).toBeChecked();
	});

	test("isShownWhenEmpty keeps the bar up with nothing picked", async () => {
		await renderWithProviders(
			<SelectionMode defaultActive>
				<SelectionMode.Bar isShownWhenEmpty>
					<SelectionMode.Action onPress={() => {}}>Share</SelectionMode.Action>
				</SelectionMode.Bar>
			</SelectionMode>
		);
		expect(screen.getByRole("button", { name: "Share" })).toBeOnTheScreen();
	});

	test("a disabled action is announced disabled and does not fire", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<SelectionMode defaultActive defaultSelected={["a"]}>
				<SelectionMode.Bar>
					<SelectionMode.Action isDisabled onPress={onPress}>
						Archive
					</SelectionMode.Action>
				</SelectionMode.Bar>
			</SelectionMode>
		);
		const action = screen.getByRole("button", { name: "Archive" });
		expect(action).toBeDisabled();
		await tap(action);
		expect(onPress).not.toHaveBeenCalled();
	});

	test("isExitOnPress leaves the mode and clears an uncontrolled selection", async () => {
		const onDelete = jest.fn();
		const onActiveChange = jest.fn();
		await renderWithProviders(
			<Inbox defaultActive defaultSelected={["a"]} isExitOnDelete onActiveChange={onActiveChange} onDelete={onDelete} />
		);

		await tap(screen.getByRole("button", { name: "Delete" }));
		expect(onDelete).toHaveBeenCalledWith(["a"]);
		expect(onActiveChange).toHaveBeenLastCalledWith(false);
		expect(screen.queryByRole("checkbox")).not.toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Delete" })).not.toBeOnTheScreen();

		await startSelecting(screen.getByRole("button", { name: "Row b" }));
		expect(checkbox("a")).not.toBeChecked();
		expect(checkbox("b")).toBeChecked();
	});

	test("the close button exits and clears an uncontrolled selection", async () => {
		const onActiveChange = jest.fn();
		const onSelectedChange = jest.fn();
		await renderWithProviders(
			<Inbox
				defaultActive
				defaultSelected={["a", "b"]}
				onActiveChange={onActiveChange}
				onSelectedChange={onSelectedChange}
			/>
		);

		await tap(screen.getByLabelText("Stop selecting"));
		expect(onActiveChange).toHaveBeenLastCalledWith(false);
		expect(onSelectedChange).toHaveBeenLastCalledWith([]);
		expect(screen.queryByRole("checkbox")).not.toBeOnTheScreen();
	});

	test("the header's close and select-all controls take their own testIDs", async () => {
		await renderWithProviders(
			<SelectionMode defaultActive values={IDS}>
				<SelectionMode.Header closeTestID="close" selectAllTestID="all" />
			</SelectionMode>
		);
		expect(screen.getByTestId("close")).toBeOnTheScreen();
		expect(screen.getByTestId("all")).toBeOnTheScreen();
	});

	test("controlled isActive: the mode waits for the prop", async () => {
		const onActiveChange = jest.fn();
		const view = await renderWithProviders(<Inbox isActive={false} onActiveChange={onActiveChange} />);

		await startSelecting(screen.getByRole("button", { name: "Row a" }));
		expect(onActiveChange).toHaveBeenCalledWith(true);
		expect(screen.queryByRole("checkbox")).not.toBeOnTheScreen();

		await view.rerender(<Inbox isActive onActiveChange={onActiveChange} />);
		expect(checkbox("a")).toBeOnTheScreen();
	});

	test("controlled selected: reports the change and waits for the prop; exit leaves it alone", async () => {
		const onSelectedChange = jest.fn();
		const onActiveChange = jest.fn();
		const view = await renderWithProviders(
			<Inbox defaultActive onActiveChange={onActiveChange} onSelectedChange={onSelectedChange} selected={["a"]} />
		);

		await tap(checkbox("b"));
		expect(onSelectedChange).toHaveBeenCalledWith(["a", "b"]);
		expect(checkbox("b")).not.toBeChecked();

		await view.rerender(
			<Inbox defaultActive onActiveChange={onActiveChange} onSelectedChange={onSelectedChange} selected={["a", "b"]} />
		);
		expect(checkbox("b")).toBeChecked();

		onSelectedChange.mockClear();
		await tap(screen.getByLabelText("Stop selecting"));
		expect(onActiveChange).toHaveBeenLastCalledWith(false);
		expect(onSelectedChange).not.toHaveBeenCalled();
	});

	test("a change that changes nothing notifies nobody", async () => {
		const onSelectedChange = jest.fn();
		await renderWithProviders(
			<Inbox defaultActive defaultSelected={["a", "b", "c"]} onSelectedChange={onSelectedChange} />
		);
		expect(screen.getByRole("button", { name: "Deselect all" })).toBeOnTheScreen();
		expect(onSelectedChange).not.toHaveBeenCalled();
	});

	test("the header announces its count on iOS when it changes", async () => {
		const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
		await renderWithProviders(<Inbox defaultActive />);
		expect(announce).toHaveBeenLastCalledWith("Pick · 0 of 3");

		await tap(checkbox("a"));
		expect(announce).toHaveBeenLastCalledWith("Pick · 1 of 3");
	});

	test("useSelectionMode exposes the selection to a custom child", async () => {
		function Readout(): ReactElement {
			const { count, isActive, isSelected } = useSelectionMode();
			return <Text>{`active=${isActive} count=${count} a=${isSelected("a")}`}</Text>;
		}
		await renderWithProviders(
			<SelectionMode defaultSelected={["a"]}>
				<Readout />
			</SelectionMode>
		);
		expect(screen.getByText("active=false count=1 a=true")).toBeOnTheScreen();
	});

	test("Indicator and Item take their value from the enclosing item, or from a prop", async () => {
		await renderWithProviders(
			<SelectionMode defaultActive defaultSelected={["z"]}>
				<SelectionMode.Item indicator="none" value="z">
					<Text>Custom</Text>
					<SelectionMode.Indicator testID="mark" />
				</SelectionMode.Item>
				<SelectionMode.Indicator testID="loose" value="z" />
			</SelectionMode>
		);
		expect(screen.getByTestId("mark", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.getByTestId("loose", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	// A list is a container, so the group is deliberately not an accessibility element (`accessible` would
	// merge its rows into one on iOS). A role query only sees accessible elements, hence label + prop here.
	test("Group: a labelled grid or strip is a list, a stack is not", async () => {
		await renderWithProviders(
			<SelectionMode>
				<SelectionMode.Group columns={3} label="Swatches" />
				<SelectionMode.Group isHorizontal label="Strip" />
				<SelectionMode.Group label="Stack" />
			</SelectionMode>
		);
		expect(screen.getByLabelText("Swatches").props.accessibilityRole).toBe("list");
		expect(screen.getByLabelText("Strip").props.accessibilityRole).toBe("list");
		expect(screen.getByLabelText("Stack").props.accessibilityRole).toBeUndefined();
	});

	describe("outside a SelectionMode", () => {
		const silenced = (run: () => Promise<unknown>) => async () => {
			const original = console.error;
			console.error = () => {};
			try {
				await run();
			} finally {
				console.error = original;
			}
		};

		test(
			"Item throws by name",
			silenced(async () => {
				await expect(
					renderWithProviders(
						<SelectionMode.Item value="a">
							<Text>x</Text>
						</SelectionMode.Item>
					)
				).rejects.toThrow("SelectionMode.Item must be rendered inside a <SelectionMode>.");
			})
		);

		test(
			"Header throws by name",
			silenced(async () => {
				await expect(renderWithProviders(<SelectionMode.Header />)).rejects.toThrow(
					"SelectionMode.Header must be rendered inside a <SelectionMode>."
				);
			})
		);

		test(
			"Bar throws by name",
			silenced(async () => {
				await expect(
					renderWithProviders(
						<SelectionMode.Bar>
							<Text>x</Text>
						</SelectionMode.Bar>
					)
				).rejects.toThrow("SelectionMode.Bar must be rendered inside a <SelectionMode>.");
			})
		);

		test(
			"Action throws by name",
			silenced(async () => {
				await expect(
					renderWithProviders(<SelectionMode.Action onPress={() => {}}>Go</SelectionMode.Action>)
				).rejects.toThrow("SelectionMode.Action must be rendered inside a <SelectionMode>.");
			})
		);

		test(
			"Group throws by name",
			silenced(async () => {
				await expect(renderWithProviders(<SelectionMode.Group />)).rejects.toThrow(
					"SelectionMode.Group must be rendered inside a <SelectionMode>."
				);
			})
		);

		test(
			"Indicator throws by name",
			silenced(async () => {
				await expect(renderWithProviders(<SelectionMode.Indicator value="a" />)).rejects.toThrow(
					"SelectionMode.Indicator must be rendered inside a <SelectionMode>."
				);
			})
		);

		test(
			"useSelectionMode throws",
			silenced(async () => {
				function Probe(): ReactElement {
					useSelectionMode();
					return <Text>x</Text>;
				}
				await expect(renderWithProviders(<Probe />)).rejects.toThrow(
					"useSelectionMode must be called inside a <SelectionMode>."
				);
			})
		);
	});

	test("an Indicator with neither a value nor an item throws", async () => {
		const original = console.error;
		console.error = () => {};
		try {
			await expect(
				renderWithProviders(
					<SelectionMode>
						<SelectionMode.Indicator />
					</SelectionMode>
				)
			).rejects.toThrow("SelectionMode.Indicator needs a `value`");
		} finally {
			console.error = original;
		}
	});
});
