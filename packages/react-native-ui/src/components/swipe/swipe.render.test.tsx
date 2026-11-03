import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { type ComponentProps, createRef, type ReactElement, type Ref } from "react";
import { Pressable } from "react-native";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../test/render";
import { Swipe, type SwipeHandle } from "./swipe";
import { useSwipeGroup } from "./swipe.context";

const HIDDEN = { hidden: true } as const;

type RowProps = Partial<ComponentProps<typeof Swipe>> & {
	onDone?: () => void;
	onDelete?: () => void;
	onSnooze?: () => void;
	keepOpen?: boolean;
};

function Row({ onDone, onDelete, onSnooze, keepOpen, ...props }: RowProps): ReactElement {
	return (
		<Swipe accessibilityLabel="Invoice" {...props}>
			<Swipe.Start>
				<Swipe.Action label="Done" onPress={onDone ?? (() => {})} />
			</Swipe.Start>
			<Swipe.End>
				<Swipe.Action isKeptOpen={keepOpen} label="Snooze" onPress={onSnooze ?? (() => {})} />
				<Swipe.Action color="destructive" label="Delete" onPress={onDelete ?? (() => {})} />
			</Swipe.End>
		</Swipe>
	);
}

async function measureRow(): Promise<void> {
	await fireEvent(screen.getByTestId("row"), "layout", {
		nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 60 } },
	});
}

async function drag(testId: string, translationX: number, velocityX = 0): Promise<void> {
	await act(async () => {
		fireGestureHandler(getByGestureTestId(testId), [
			{ state: State.BEGAN },
			{ state: State.ACTIVE },
			{ state: State.ACTIVE, translationX, velocityX },
			{ state: State.END, translationX, velocityX },
		]);
	});
}

describe("Swipe", () => {
	test("the row is one labelled accessibility element publishing each action", async () => {
		await renderWithProviders(<Row />);
		const row = screen.getByLabelText("Invoice");
		expect(row.props.accessible).toBe(true);
		expect(row.props.accessibilityActions).toEqual([
			{ label: "Done", name: "Done" },
			{ label: "Snooze", name: "Snooze" },
			{ label: "Delete", name: "Delete" },
		]);
	});

	test("an assistive action runs the matching onPress", async () => {
		const onDone = jest.fn();
		const onDelete = jest.fn();
		await renderWithProviders(<Row onDelete={onDelete} onDone={onDone} />);
		await fireEvent(screen.getByLabelText("Invoice"), "accessibilityAction", { nativeEvent: { actionName: "Delete" } });
		expect(onDelete).toHaveBeenCalledTimes(1);
		expect(onDone).not.toHaveBeenCalled();
	});

	test("tiles are hidden from assistive technology while the row is shut and exposed once open", async () => {
		const ref = createRef<SwipeHandle>();
		await renderWithProviders(<Row ref={ref} />);
		expect(screen.queryByRole("button", { name: "Delete" })).not.toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Delete", ...HIDDEN })).toBeOnTheScreen();

		await act(async () => ref.current?.open("end"));
		expect(screen.getByRole("button", { name: "Delete" })).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Done", ...HIDDEN })).toBeOnTheScreen();
	});

	test("the imperative handle opens a side, closes it, and ignores a side with no tiles", async () => {
		const ref = createRef<SwipeHandle>();
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Swipe onOpenChange={onOpenChange} ref={ref}>
				<Swipe.End>
					<Swipe.Action label="Delete" onPress={() => {}} />
				</Swipe.End>
			</Swipe>
		);
		await act(async () => ref.current?.open("start"));
		expect(onOpenChange).not.toHaveBeenCalled();

		await act(async () => ref.current?.open("end"));
		expect(onOpenChange).toHaveBeenLastCalledWith("end");

		await act(async () => ref.current?.close());
		expect(onOpenChange).toHaveBeenLastCalledWith(null);
		expect(onOpenChange).toHaveBeenCalledTimes(2);
	});

	test("a tile press runs its action then closes the row", async () => {
		const ref = createRef<SwipeHandle>();
		const onSnooze = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(<Row onOpenChange={onOpenChange} onSnooze={onSnooze} ref={ref} />);
		await act(async () => ref.current?.open("end"));
		await fireEvent(screen.getByRole("button", { name: "Snooze" }), "accessibilityTap");
		expect(onSnooze).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenLastCalledWith(null);
	});

	test("isKeptOpen leaves the row open after the action", async () => {
		const ref = createRef<SwipeHandle>();
		const onSnooze = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(<Row keepOpen onOpenChange={onOpenChange} onSnooze={onSnooze} ref={ref} />);
		await act(async () => ref.current?.open("end"));
		await fireEvent(screen.getByRole("button", { name: "Snooze" }), "accessibilityTap");
		expect(onSnooze).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenLastCalledWith("end");
	});

	test("a drag past half the panel settles open on that side", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Row onOpenChange={onOpenChange} />);
		await drag("swipe-pan", -100);
		expect(onOpenChange).toHaveBeenLastCalledWith("end");
		expect(screen.getByRole("button", { name: "Delete" })).toBeOnTheScreen();
	});

	test("a short drag settles shut without announcing a change", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Row onOpenChange={onOpenChange} />);
		await drag("swipe-pan", -20);
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("a drag toward a side with no tiles never opens it", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Swipe onOpenChange={onOpenChange}>
				<Swipe.End>
					<Swipe.Action label="Delete" onPress={() => {}} />
				</Swipe.End>
			</Swipe>
		);
		await drag("swipe-pan", 120);
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("a full swipe fires the outermost action, then reports shut", async () => {
		const onDelete = jest.fn();
		const onSnooze = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(<Row onDelete={onDelete} onOpenChange={onOpenChange} onSnooze={onSnooze} testID="row" />);
		await measureRow();
		await drag("swipe-pan", -280, -2000);
		await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
		expect(onSnooze).not.toHaveBeenCalled();
		expect(onOpenChange).toHaveBeenLastCalledWith(null);
	});

	test("isFullSwipe={false} never fires an action from a drag", async () => {
		const onDelete = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(<Row isFullSwipe={false} testID="row" onDelete={onDelete} onOpenChange={onOpenChange} />);
		await measureRow();
		await drag("swipe-pan", -280, -2000);
		expect(onDelete).not.toHaveBeenCalled();
		expect(onOpenChange).toHaveBeenLastCalledWith("end");
	});

	test("isDisabled turns the drag off", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Row isDisabled onOpenChange={onOpenChange} />);
		await drag("swipe-pan", -100);
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("tapping the open row closes it", async () => {
		const ref = createRef<SwipeHandle>();
		const onOpenChange = jest.fn();
		await renderWithProviders(<Row onOpenChange={onOpenChange} ref={ref} />);
		await act(async () => ref.current?.open("end"));
		await act(async () => {
			fireGestureHandler(getByGestureTestId("swipe-shield"), [
				{ state: State.BEGAN },
				{ state: State.ACTIVE },
				{ state: State.END },
			]);
		});
		expect(onOpenChange).toHaveBeenLastCalledWith(null);
	});

	describe("Swipe.Group", () => {
		function Rows({ isExclusive, refs }: { isExclusive?: boolean; refs: [Ref<SwipeHandle>, Ref<SwipeHandle>] }) {
			return (
				<Swipe.Group isExclusive={isExclusive}>
					<Row accessibilityLabel="First" onOpenChange={firstChange} ref={refs[0]} />
					<Row accessibilityLabel="Second" ref={refs[1]} />
					<CloseAll />
				</Swipe.Group>
			);
		}
		const firstChange = jest.fn();
		function CloseAll(): ReactElement {
			const { closeAll } = useSwipeGroup();
			return <Pressable accessibilityLabel="Close all" accessibilityRole="button" onPress={closeAll} />;
		}

		beforeEach(() => {
			firstChange.mockClear();
		});

		test("opening a row closes the others", async () => {
			const a = createRef<SwipeHandle>();
			const b = createRef<SwipeHandle>();
			await renderWithProviders(<Rows refs={[a, b]} />);
			await act(async () => a.current?.open("end"));
			expect(firstChange).toHaveBeenLastCalledWith("end");
			await act(async () => b.current?.open("end"));
			expect(firstChange).toHaveBeenLastCalledWith(null);
		});

		test("isExclusive={false} lets rows stay open together", async () => {
			const a = createRef<SwipeHandle>();
			const b = createRef<SwipeHandle>();
			await renderWithProviders(<Rows isExclusive={false} refs={[a, b]} />);
			await act(async () => a.current?.open("end"));
			await act(async () => b.current?.open("end"));
			expect(firstChange).toHaveBeenCalledTimes(1);
			expect(firstChange).toHaveBeenLastCalledWith("end");
		});

		test("useSwipeGroup().closeAll closes every open row", async () => {
			const a = createRef<SwipeHandle>();
			const b = createRef<SwipeHandle>();
			await renderWithProviders(<Rows isExclusive={false} refs={[a, b]} />);
			await act(async () => a.current?.open("end"));
			await fireEvent.press(screen.getByRole("button", { name: "Close all" }));
			expect(firstChange).toHaveBeenLastCalledWith(null);
		});

		test("useSwipeGroup outside a group is a no-op", async () => {
			function Probe(): ReactElement {
				const { closeAll } = useSwipeGroup();
				closeAll();
				return <Pressable accessibilityLabel="probe" />;
			}
			await renderWithProviders(<Probe />);
			expect(screen.getByLabelText("probe")).toBeOnTheScreen();
		});
	});

	describe("outside its root", () => {
		let spy: ReturnType<typeof jest.spyOn>;
		beforeEach(() => {
			spy = jest.spyOn(console, "error").mockImplementation(() => {});
		});
		afterEach(() => spy.mockRestore());

		test("Swipe.Action outside a Swipe throws", async () => {
			await expect(renderWithProviders(<Swipe.Action label="x" onPress={() => {}} />)).rejects.toThrow(
				"Swipe.Action must be rendered inside a <Swipe>."
			);
		});

		test("Swipe.Action inside the row but outside a marker throws", async () => {
			await expect(
				renderWithProviders(
					<Swipe>
						<Swipe.Action label="x" onPress={() => {}} />
					</Swipe>
				)
			).rejects.toThrow("Swipe.Action must be written inside <Swipe.Start> or <Swipe.End>.");
		});
	});
});
