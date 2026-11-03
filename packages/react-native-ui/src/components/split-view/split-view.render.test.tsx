import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { type ReactElement, useState } from "react";
import { Text } from "react-native";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { SplitView, useSplitView } from "./index";

const action = (actionName: string) => ({ nativeEvent: { actionName } });

const measure = (height: number) => ({ nativeEvent: { layout: { height, width: 300, x: 0, y: 0 } } });

type HarnessProps = {
	snapIndex?: number;
	defaultSnapIndex?: number;
	onSnapIndexChange?: (index: number) => void;
	snapPoints?: readonly number[];
	isDisabled?: boolean;
	variant?: "panes" | "seam";
	label?: string;
	minTopHeight?: number;
	minBottomHeight?: number;
};

function Harness({ label, ...props }: HarnessProps): ReactElement {
	return (
		<SplitView testID="split" {...props}>
			<SplitView.Top>
				<Text>Map</Text>
			</SplitView.Top>
			<SplitView.DragArea accessibilityLabel={label} />
			<SplitView.Bottom>
				<Text>List</Text>
			</SplitView.Bottom>
		</SplitView>
	);
}

describe("SplitView", () => {
	test("renders both panes and an adjustable drag row named Resize panes by default", async () => {
		await renderWithProviders(<Harness />);
		expect(screen.getByText("Map")).toBeOnTheScreen();
		expect(screen.getByText("List")).toBeOnTheScreen();
		expect(screen.getByRole("adjustable", { name: "Resize panes" })).toBeOnTheScreen();
	});

	test("the drag row takes the caller's label", async () => {
		await renderWithProviders(<Harness label="Resize map" />);
		expect(screen.getByRole("adjustable", { name: "Resize map" })).toBeOnTheScreen();
	});

	test("announces the middle stop of the default three as Position 2 of 3", async () => {
		await renderWithProviders(<Harness />);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
			max: 2,
			min: 0,
			now: 1,
			text: "Position 2 of 3",
		});
	});

	test("defaultSnapIndex seeds the position", async () => {
		await renderWithProviders(<Harness defaultSnapIndex={0} />);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 0, text: "Position 1 of 3" });
	});

	test("snapPoints sets how many stops there are", async () => {
		await renderWithProviders(<Harness snapPoints={[0.3, 0.6, 0.9, 1]} defaultSnapIndex={3} />);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ max: 3, now: 3, text: "Position 4 of 4" });
	});

	test("offers increment, decrement and activate mid-range", async () => {
		await renderWithProviders(<Harness />);
		expect(screen.getByRole("adjustable").props.accessibilityActions).toEqual([
			{ name: "increment" },
			{ name: "decrement" },
			{ label: "Next position", name: "activate" },
		]);
	});

	test("offers no decrement at the first stop and no increment at the last", async () => {
		const view = await renderWithProviders(<Harness snapIndex={0} />);
		expect(screen.getByRole("adjustable").props.accessibilityActions).toEqual([
			{ name: "increment" },
			{ label: "Next position", name: "activate" },
		]);
		await view.rerender(<Harness snapIndex={2} />);
		expect(screen.getByRole("adjustable").props.accessibilityActions).toEqual([
			{ name: "decrement" },
			{ label: "Next position", name: "activate" },
		]);
	});

	test("uncontrolled: increment and decrement step one stop and report it", async () => {
		const onSnapIndexChange = jest.fn();
		await renderWithProviders(<Harness onSnapIndexChange={onSnapIndexChange} />);

		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("increment"));
		expect(onSnapIndexChange).toHaveBeenLastCalledWith(2);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 2, text: "Position 3 of 3" });

		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("decrement"));
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("decrement"));
		expect(onSnapIndexChange).toHaveBeenLastCalledWith(0);
		expect(onSnapIndexChange).toHaveBeenCalledTimes(3);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 0 });
	});

	test("increment at the last stop and decrement at the first report nothing", async () => {
		const onSnapIndexChange = jest.fn();
		await renderWithProviders(<Harness defaultSnapIndex={0} onSnapIndexChange={onSnapIndexChange} />);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("decrement"));
		expect(onSnapIndexChange).not.toHaveBeenCalled();

		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("increment"));
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("increment"));
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("increment"));
		expect(onSnapIndexChange).toHaveBeenCalledTimes(2);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 2 });
	});

	test("activate cycles to the next stop and wraps from the last to the first", async () => {
		const onSnapIndexChange = jest.fn();
		await renderWithProviders(<Harness onSnapIndexChange={onSnapIndexChange} />);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("activate"));
		expect(onSnapIndexChange).toHaveBeenLastCalledWith(2);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("activate"));
		expect(onSnapIndexChange).toHaveBeenLastCalledWith(0);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 0 });
	});

	test("an unknown action name does nothing", async () => {
		const onSnapIndexChange = jest.fn();
		await renderWithProviders(<Harness onSnapIndexChange={onSnapIndexChange} />);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("longpress"));
		expect(onSnapIndexChange).not.toHaveBeenCalled();
	});

	test("controlled: reports the change and waits for the snapIndex prop", async () => {
		const onSnapIndexChange = jest.fn();
		const view = await renderWithProviders(<Harness snapIndex={1} onSnapIndexChange={onSnapIndexChange} />);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("increment"));
		expect(onSnapIndexChange).toHaveBeenCalledWith(2);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 1 });

		await view.rerender(<Harness snapIndex={2} onSnapIndexChange={onSnapIndexChange} />);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 2, text: "Position 3 of 3" });
	});

	test("root isDisabled is announced, offers no actions and ignores every action", async () => {
		const onSnapIndexChange = jest.fn();
		await renderWithProviders(<Harness isDisabled onSnapIndexChange={onSnapIndexChange} />);
		const row = screen.getByRole("adjustable");
		expect(row).toBeDisabled();
		expect(row.props.accessibilityActions).toEqual([]);
		await fireEvent(row, "accessibilityAction", action("increment"));
		await fireEvent(row, "accessibilityAction", action("activate"));
		expect(onSnapIndexChange).not.toHaveBeenCalled();
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 1 });
	});

	test("an enabled drag row is not disabled", async () => {
		await renderWithProviders(<Harness />);
		expect(screen.getByRole("adjustable")).toBeEnabled();
	});

	test("the seam variant keeps the same accessible surface", async () => {
		await renderWithProviders(<Harness variant="seam" label="Resize preview" />);
		expect(screen.getByRole("adjustable", { name: "Resize preview" })).toHaveAccessibilityValue({
			now: 1,
			text: "Position 2 of 3",
		});
	});

	test("the grip is hidden from assistive technology", async () => {
		await renderWithProviders(
			<SplitView>
				<SplitView.Top />
				<SplitView.DragArea>
					<SplitView.Handle testID="grip" />
				</SplitView.DragArea>
				<SplitView.Bottom />
			</SplitView>
		);
		expect(screen.queryByTestId("grip")).toBeNull();
		expect(screen.getByTestId("grip", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("useSplitView hands a custom child the stop, its count and snapTo", async () => {
		function Controls() {
			const { snapIndex, snapCount, snapTo, isDisabled } = useSplitView();
			return (
				<>
					<Text testID="readout">{`${snapIndex}/${snapCount}/${String(isDisabled)}`}</Text>
					<Text onPress={() => snapTo(2)}>expand</Text>
					<Text onPress={() => snapTo(99)}>overshoot</Text>
				</>
			);
		}
		const onSnapIndexChange = jest.fn();
		await renderWithProviders(
			<SplitView onSnapIndexChange={onSnapIndexChange}>
				<SplitView.Top>
					<Controls />
				</SplitView.Top>
				<SplitView.DragArea />
				<SplitView.Bottom />
			</SplitView>
		);
		expect(screen.getByTestId("readout")).toHaveTextContent("1/3/false");
		await fireEvent.press(screen.getByText("expand"));
		expect(onSnapIndexChange).toHaveBeenCalledWith(2);
		expect(screen.getByTestId("readout")).toHaveTextContent("2/3/false");
		await fireEvent.press(screen.getByText("overshoot"));
		expect(onSnapIndexChange).toHaveBeenCalledTimes(1);
	});

	test("a controlled parent can drive the stop from outside through snapTo", async () => {
		function Parent() {
			const [index, setIndex] = useState(0);
			return (
				<>
					<Text testID="parent">{String(index)}</Text>
					<Harness snapIndex={index} onSnapIndexChange={setIndex} />
				</>
			);
		}
		await renderWithProviders(<Parent />);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("increment"));
		expect(screen.getByTestId("parent")).toHaveTextContent("1");
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 1 });
	});

	test("a part outside a SplitView throws its documented error", async () => {
		const original = console.error;
		console.error = () => {};
		try {
			await expect(renderWithProviders(<SplitView.Top />)).rejects.toThrow(
				"SplitView.Top must be rendered inside a <SplitView>."
			);
			await expect(renderWithProviders(<SplitView.Bottom />)).rejects.toThrow(
				"SplitView.Bottom must be rendered inside a <SplitView>."
			);
			await expect(renderWithProviders(<SplitView.DragArea />)).rejects.toThrow(
				"SplitView.DragArea must be rendered inside a <SplitView>."
			);
			await expect(renderWithProviders(<SplitView.Handle />)).rejects.toThrow(
				"SplitView.Handle must be rendered inside a <SplitView>."
			);
			function Probe() {
				useSplitView();
				return null;
			}
			await expect(renderWithProviders(<Probe />)).rejects.toThrow("useSplitView must be called inside a <SplitView>.");
		} finally {
			console.error = original;
		}
	});

	describe("warnings", () => {
		let warn: jest.SpiedFunction<typeof console.warn>;
		beforeEach(() => {
			warn = jest.spyOn(console, "warn").mockImplementation(() => {});
		});
		afterEach(() => {
			warn.mockRestore();
		});

		test("a controlled snapIndex out of range is clamped and warned about", async () => {
			await renderWithProviders(<Harness snapIndex={9} />);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 2 });
			expect(warn).toHaveBeenCalledWith(expect.stringContaining("snapIndex 9 is outside 0..2"));
		});

		test("fewer than two snap points falls back to the defaults with a warning", async () => {
			await renderWithProviders(<Harness snapPoints={[0.5]} />);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ max: 2 });
			expect(warn).toHaveBeenCalled();
		});

		test("children out of order warn", async () => {
			await renderWithProviders(
				<SplitView>
					<SplitView.Bottom />
					<SplitView.DragArea />
					<SplitView.Top />
				</SplitView>
			);
			expect(warn).toHaveBeenCalled();
		});

		test("a well-formed split view warns about nothing", async () => {
			await renderWithProviders(<Harness />);
			expect(warn).not.toHaveBeenCalled();
		});

		test("minimums that cannot both fit warn once measured", async () => {
			await renderWithProviders(<Harness minTopHeight={200} minBottomHeight={200} />);
			await fireEvent(screen.getByTestId("split"), "layout", measure(300));
			expect(warn).toHaveBeenCalledWith(expect.stringContaining("do not both fit in 300pt"));
		});
	});

	test("onLayout is forwarded to the caller", async () => {
		const onLayout = jest.fn();
		await renderWithProviders(
			<SplitView onLayout={onLayout} testID="split">
				<SplitView.Top />
				<SplitView.DragArea />
				<SplitView.Bottom />
			</SplitView>
		);
		await fireEvent(screen.getByTestId("split"), "layout", measure(400));
		expect(onLayout).toHaveBeenCalledTimes(1);
	});

	describe("drag and tap", () => {
		async function mountMeasured(props: HarnessProps = {}) {
			await renderWithProviders(<Harness {...props} />);
			await fireEvent(screen.getByTestId("split"), "layout", measure(444));
		}

		test("a tap on the drag row cycles to the next stop", async () => {
			const onSnapIndexChange = jest.fn();
			await mountMeasured({ onSnapIndexChange });
			await act(async () => {
				fireGestureHandler(getByGestureTestId("split-view-tap"), [{ state: 2 }, { state: 4 }, { state: 5 }]);
			});
			expect(onSnapIndexChange).toHaveBeenCalledTimes(1);
			expect(onSnapIndexChange).toHaveBeenCalledWith(2);
		});

		test("a disabled split view ignores a tap", async () => {
			const onSnapIndexChange = jest.fn();
			await mountMeasured({ isDisabled: true, onSnapIndexChange });
			await act(async () => {
				fireGestureHandler(getByGestureTestId("split-view-tap"), [{ state: 2 }, { state: 4 }, { state: 5 }]);
			});
			expect(onSnapIndexChange).not.toHaveBeenCalled();
		});

		test("dragging down far enough settles on the last stop and reports it once", async () => {
			const onSnapIndexChange = jest.fn();
			await mountMeasured({ onSnapIndexChange });
			await act(async () => {
				fireGestureHandler(getByGestureTestId("split-view-pan"), [
					{ translationY: 0, velocityY: 0 },
					{ translationY: 300, velocityY: 0 },
					{ translationY: 300, velocityY: 0 },
				]);
			});
			expect(onSnapIndexChange).toHaveBeenCalledTimes(1);
			expect(onSnapIndexChange).toHaveBeenCalledWith(2);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 2, text: "Position 3 of 3" });
		});

		test("dragging up far enough settles on the first stop", async () => {
			const onSnapIndexChange = jest.fn();
			await mountMeasured({ onSnapIndexChange });
			await act(async () => {
				fireGestureHandler(getByGestureTestId("split-view-pan"), [
					{ translationY: 0, velocityY: 0 },
					{ translationY: -300, velocityY: 0 },
					{ translationY: -300, velocityY: 0 },
				]);
			});
			expect(onSnapIndexChange).toHaveBeenCalledWith(0);
		});

		test("a drag released back on its own stop reports nothing", async () => {
			const onSnapIndexChange = jest.fn();
			await mountMeasured({ onSnapIndexChange });
			await act(async () => {
				fireGestureHandler(getByGestureTestId("split-view-pan"), [
					{ translationY: 0, velocityY: 0 },
					{ translationY: 30, velocityY: 0 },
					{ translationY: 0, velocityY: 0 },
				]);
			});
			expect(onSnapIndexChange).not.toHaveBeenCalled();
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 1 });
		});

		test("a touch that stays inside the tap slop is not a drag", async () => {
			const onSnapIndexChange = jest.fn();
			await mountMeasured({ onSnapIndexChange });
			await act(async () => {
				fireGestureHandler(getByGestureTestId("split-view-pan"), [
					{ translationY: 0, velocityY: 0 },
					{ translationY: 3, velocityY: 0 },
					{ translationY: 3, velocityY: 0 },
				]);
			});
			expect(onSnapIndexChange).not.toHaveBeenCalled();
		});

		test("a controlled parent that rejects the dragged stop keeps its index", async () => {
			const onSnapIndexChange = jest.fn();
			await mountMeasured({ onSnapIndexChange, snapIndex: 1 });
			await act(async () => {
				fireGestureHandler(getByGestureTestId("split-view-pan"), [
					{ translationY: 0, velocityY: 0 },
					{ translationY: 300, velocityY: 0 },
					{ translationY: 300, velocityY: 0 },
				]);
			});
			expect(onSnapIndexChange).toHaveBeenCalledWith(2);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 1 });
		});

		test("a disabled split view ignores a drag", async () => {
			const onSnapIndexChange = jest.fn();
			await mountMeasured({ isDisabled: true, onSnapIndexChange });
			await act(async () => {
				fireGestureHandler(getByGestureTestId("split-view-pan"), [
					{ translationY: 0, velocityY: 0 },
					{ translationY: 300, velocityY: 0 },
					{ translationY: 300, velocityY: 0 },
				]);
			});
			expect(onSnapIndexChange).not.toHaveBeenCalled();
		});
	});
});
