import { afterEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Sortable } from "./sortable";
import { useSortableItem } from "./sortable.context";

// Reorder by drag is a Gesture Handler pan whose result lands through a UI-thread animation
// callback; Jest has no UI thread, so the drag path is not driven here. The screen-reader path
// (Move up / Move down) calls the same `onReorder` and is what these tests drive.

type Rendered = ReturnType<typeof screen.getByLabelText>;

type Row = { id: string; pinned?: boolean; disabled?: boolean };

function List({
	rows,
	onReorder,
	activation,
	isDisabled,
}: {
	rows: Row[];
	onReorder: (order: string[], details: { id: string; from: number; to: number }) => void;
	activation?: "handle" | "long-press";
	isDisabled?: boolean;
}): ReactElement {
	return (
		<Sortable activation={activation} isDisabled={isDisabled} onReorder={onReorder} value={rows.map((r) => r.id)}>
			{rows.map((row) => (
				<Sortable.Item id={row.id} isDisabled={row.disabled} isPinned={row.pinned} key={row.id}>
					<Text>{row.id}</Text>
					<Sortable.Handle accessibilityLabel={`Reorder ${row.id}`} />
				</Sortable.Item>
			))}
		</Sortable>
	);
}

const rows: Row[] = [{ id: "a" }, { id: "b" }, { id: "c" }];

function actionNames(element: Rendered): string[] {
	const actions = element.props.accessibilityActions as { name: string }[] | undefined;
	return (actions ?? []).map((action) => action.name);
}

function rowOf(id: string) {
	return screen.getByText(id).parent as NonNullable<ReturnType<typeof screen.getByText>["parent"]>;
}

function act(element: Rendered, actionName: string) {
	return fireEvent(element, "accessibilityAction", { nativeEvent: { actionName } });
}

afterEach(() => {
	jest.restoreAllMocks();
});

describe("Sortable (handle mode)", () => {
	test("each handle is a labelled button announcing its position", async () => {
		await renderWithProviders(<List onReorder={jest.fn()} rows={rows} />);
		const handle = screen.getByRole("button", { name: "Reorder b" });
		expect(handle).toHaveAccessibilityValue({ text: "Position 2 of 3" });
		expect(handle).not.toBeDisabled();
		expect(screen.getByText("a")).toBeOnTheScreen();
	});

	test("offers only the moves a row can make", async () => {
		await renderWithProviders(<List onReorder={jest.fn()} rows={rows} />);
		expect(actionNames(screen.getByLabelText("Reorder a"))).toEqual(["moveDown"]);
		expect(actionNames(screen.getByLabelText("Reorder b"))).toEqual(["moveUp", "moveDown"]);
		expect(actionNames(screen.getByLabelText("Reorder c"))).toEqual(["moveUp"]);
	});

	test("moveDown calls onReorder with the new order and details", async () => {
		const onReorder = jest.fn();
		await renderWithProviders(<List onReorder={onReorder} rows={rows} />);
		await act(screen.getByLabelText("Reorder a"), "moveDown");
		expect(onReorder).toHaveBeenCalledTimes(1);
		expect(onReorder).toHaveBeenCalledWith(["b", "a", "c"], { from: 0, id: "a", to: 1 });
	});

	test("moveUp calls onReorder with the new order and details", async () => {
		const onReorder = jest.fn();
		await renderWithProviders(<List onReorder={onReorder} rows={rows} />);
		await act(screen.getByLabelText("Reorder c"), "moveUp");
		expect(onReorder).toHaveBeenCalledWith(["a", "c", "b"], { from: 2, id: "c", to: 1 });
	});

	test("the list is caller-owned: it does not reorder until value changes", async () => {
		const onReorder = jest.fn();
		const view = await renderWithProviders(<List onReorder={onReorder} rows={rows} />);
		await act(screen.getByLabelText("Reorder a"), "moveDown");
		expect(screen.getByLabelText("Reorder a")).toHaveAccessibilityValue({ text: "Position 1 of 3" });

		await view.rerender(<List onReorder={onReorder} rows={[{ id: "b" }, { id: "a" }, { id: "c" }]} />);
		expect(screen.getByLabelText("Reorder a")).toHaveAccessibilityValue({ text: "Position 2 of 3" });
	});

	test("a pinned row has no actions and is skipped by its neighbours", async () => {
		const onReorder = jest.fn();
		await renderWithProviders(
			<List onReorder={onReorder} rows={[{ id: "a" }, { id: "b", pinned: true }, { id: "c" }]} />
		);
		const pinned = screen.getByLabelText("Reorder b");
		expect(pinned).toBeDisabled();
		expect(actionNames(pinned)).toEqual([]);

		await act(screen.getByLabelText("Reorder a"), "moveDown");
		expect(onReorder).toHaveBeenCalledWith(["c", "b", "a"], { from: 0, id: "a", to: 2 });
	});

	test("a disabled row cannot be moved but the others still can", async () => {
		const onReorder = jest.fn();
		await renderWithProviders(
			<List onReorder={onReorder} rows={[{ id: "a" }, { id: "b", disabled: true }, { id: "c" }]} />
		);
		const disabled = screen.getByLabelText("Reorder b");
		expect(disabled).toBeDisabled();
		expect(actionNames(disabled)).toEqual([]);
		await act(disabled, "moveDown");
		expect(onReorder).not.toHaveBeenCalled();

		await act(screen.getByLabelText("Reorder c"), "moveUp");
		expect(onReorder).toHaveBeenCalledTimes(1);
	});

	test("isDisabled on the list disables every handle and fires nothing", async () => {
		const onReorder = jest.fn();
		await renderWithProviders(<List isDisabled onReorder={onReorder} rows={rows} />);
		for (const id of ["a", "b", "c"]) {
			const handle = screen.getByLabelText(`Reorder ${id}`);
			expect(handle).toBeDisabled();
			expect(actionNames(handle)).toEqual([]);
		}
		await act(screen.getByLabelText("Reorder b"), "moveUp");
		expect(onReorder).not.toHaveBeenCalled();
	});

	test("the default handle label is Drag to reorder", async () => {
		await renderWithProviders(
			<Sortable onReorder={jest.fn()} value={["a"]}>
				<Sortable.Item id="a">
					<Sortable.Handle />
				</Sortable.Item>
			</Sortable>
		);
		expect(screen.getByRole("button", { name: "Drag to reorder" })).toBeOnTheScreen();
	});
});

describe("Sortable (long-press mode)", () => {
	test("the row is the accessible element, the handle is hidden", async () => {
		await renderWithProviders(<List activation="long-press" onReorder={jest.fn()} rows={rows} />);
		expect(screen.queryByRole("button", { name: "Reorder b" })).not.toBeOnTheScreen();
		const row = rowOf("b");
		expect(row).toHaveAccessibilityValue({ text: "Position 2 of 3" });
		expect(actionNames(row)).toEqual(["moveUp", "moveDown"]);
	});

	test("an action on the row calls onReorder", async () => {
		const onReorder = jest.fn();
		await renderWithProviders(<List activation="long-press" onReorder={onReorder} rows={rows} />);
		await act(rowOf("a"), "moveDown");
		expect(onReorder).toHaveBeenCalledWith(["b", "a", "c"], { from: 0, id: "a", to: 1 });
	});
});

describe("Sortable parts outside their root", () => {
	test("Sortable.Item outside a Sortable throws", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		await expect(
			renderWithProviders(
				<Sortable.Item id="a">
					<Text>a</Text>
				</Sortable.Item>
			)
		).rejects.toThrow("Sortable.Item must be rendered inside a <Sortable>.");
		spy.mockRestore();
	});

	test("Sortable.Handle outside an Item throws", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		await expect(
			renderWithProviders(
				<Sortable onReorder={jest.fn()} value={["a"]}>
					<Sortable.Handle />
				</Sortable>
			)
		).rejects.toThrow("Sortable.Handle must be rendered inside a <Sortable.Item>.");
		spy.mockRestore();
	});

	test("useSortableItem outside an Item throws", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		function Probe(): ReactElement {
			useSortableItem();
			return <Text>x</Text>;
		}
		await expect(renderWithProviders(<Probe />)).rejects.toThrow(
			"useSortableItem must be called inside a <Sortable.Item>."
		);
		spy.mockRestore();
	});
});
