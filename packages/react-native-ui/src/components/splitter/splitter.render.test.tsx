import { describe, expect, jest, test } from "@jest/globals";
import { Text } from "react-native";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { Splitter, type SplitterLayout } from "./index";
import { useSplitter } from "./splitter.context";

const action = (actionName: string) => ({ nativeEvent: { actionName } });

function Two({
	onLayoutChange,
	...props
}: {
	onLayoutChange?: (layout: SplitterLayout) => void;
	layout?: SplitterLayout;
	defaultLayout?: SplitterLayout;
	isDisabled?: boolean;
	handleDisabled?: boolean;
	collapsible?: boolean;
	step?: number;
}) {
	const { handleDisabled, collapsible, ...root } = props;
	return (
		<Splitter onLayoutChange={onLayoutChange} {...root}>
			<Splitter.Pane isCollapsible={collapsible} minSize={20}>
				<Text>Left</Text>
			</Splitter.Pane>
			<Splitter.Handle accessibilityLabel="Resize sidebar" isDisabled={handleDisabled} />
			<Splitter.Pane minSize={20}>
				<Text>Right</Text>
			</Splitter.Pane>
		</Splitter>
	);
}

describe("Splitter", () => {
	test("renders panes and an adjustable handle with a name and value", async () => {
		await renderWithProviders(<Two defaultLayout={[30, 70]} />);
		expect(screen.getByText("Left")).toBeOnTheScreen();
		expect(screen.getByText("Right")).toBeOnTheScreen();
		const handle = screen.getByRole("adjustable", { name: "Resize sidebar" });
		expect(handle).toHaveAccessibilityValue({ max: 100, min: 0, now: 30, text: "30 percent" });
	});

	test("the handle is named Resize when the caller names nothing", async () => {
		await renderWithProviders(
			<Splitter>
				<Splitter.Pane />
				<Splitter.Handle />
				<Splitter.Pane />
			</Splitter>
		);
		expect(screen.getByRole("adjustable", { name: "Resize" })).toHaveAccessibilityValue({ now: 50 });
	});

	test("uncontrolled: increment and decrement move the seam by step and report it", async () => {
		const onLayoutChange = jest.fn();
		await renderWithProviders(<Two defaultLayout={[30, 70]} onLayoutChange={onLayoutChange} />);
		const handle = screen.getByRole("adjustable");

		await fireEvent(handle, "accessibilityAction", action("increment"));
		expect(onLayoutChange).toHaveBeenLastCalledWith([35, 65]);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 35, text: "35 percent" });

		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("decrement"));
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("decrement"));
		expect(onLayoutChange).toHaveBeenLastCalledWith([25, 75]);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 25 });
	});

	test("step sets how far one increment moves", async () => {
		const onLayoutChange = jest.fn();
		await renderWithProviders(<Two defaultLayout={[30, 70]} onLayoutChange={onLayoutChange} step={10} />);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("increment"));
		expect(onLayoutChange).toHaveBeenCalledWith([40, 60]);
	});

	test("a step that would cross a pane's minSize stops at the bound and reports nothing", async () => {
		const onLayoutChange = jest.fn();
		await renderWithProviders(<Two defaultLayout={[20, 80]} onLayoutChange={onLayoutChange} />);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("decrement"));
		expect(onLayoutChange).not.toHaveBeenCalled();
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 20 });
	});

	test("controlled: reports the change and waits for the layout prop", async () => {
		const onLayoutChange = jest.fn();
		const view = await renderWithProviders(<Two layout={[30, 70]} onLayoutChange={onLayoutChange} />);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("increment"));
		expect(onLayoutChange).toHaveBeenCalledWith([35, 65]);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 30 });

		await view.rerender(<Two layout={[35, 65]} onLayoutChange={onLayoutChange} />);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 35 });
	});

	test("the reset action restores the starting layout, and does nothing when already there", async () => {
		const onLayoutChange = jest.fn();
		await renderWithProviders(<Two defaultLayout={[30, 70]} onLayoutChange={onLayoutChange} />);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("reset"));
		expect(onLayoutChange).not.toHaveBeenCalled();

		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("increment"));
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("reset"));
		expect(onLayoutChange).toHaveBeenLastCalledWith([30, 70]);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 30 });
	});

	test("offers increment, decrement and reset", async () => {
		await renderWithProviders(<Two />);
		expect(screen.getByRole("adjustable").props.accessibilityActions).toEqual([
			{ name: "increment" },
			{ name: "decrement" },
			{ label: "Reset sizes", name: "reset" },
		]);
	});

	test("a collapsible neighbour adds collapse / expand and announces expanded state", async () => {
		const onLayoutChange = jest.fn();
		await renderWithProviders(<Two collapsible defaultLayout={[30, 70]} onLayoutChange={onLayoutChange} />);
		const handle = screen.getByRole("adjustable");
		expect(handle).toBeExpanded();
		expect(handle.props.accessibilityActions).toContainEqual({ label: "Collapse", name: "collapse" });

		await fireEvent(handle, "accessibilityAction", action("collapse"));
		expect(onLayoutChange).toHaveBeenLastCalledWith([0, 100]);
		const collapsed = screen.getByRole("adjustable");
		expect(collapsed).toBeCollapsed();
		expect(collapsed.props.accessibilityActions).toContainEqual({ label: "Expand", name: "expand" });

		await fireEvent(collapsed, "accessibilityAction", action("expand"));
		expect(screen.getByRole("adjustable")).toBeExpanded();
	});

	test("a pane without isCollapsible leaves expanded state unset", async () => {
		await renderWithProviders(<Two />);
		expect(screen.getByRole("adjustable").props.accessibilityState.expanded).toBeUndefined();
	});

	test("a collapsed pane is hidden from assistive technology", async () => {
		await renderWithProviders(<Two collapsible defaultLayout={[0, 100]} />);
		expect(screen.getByText("Left", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.queryByText("Left")).toBeNull();
		expect(screen.getByText("Right")).toBeOnTheScreen();
	});

	test("root isDisabled is announced and ignores every action", async () => {
		const onLayoutChange = jest.fn();
		await renderWithProviders(<Two isDisabled onLayoutChange={onLayoutChange} />);
		const handle = screen.getByRole("adjustable");
		expect(handle).toBeDisabled();
		await fireEvent(handle, "accessibilityAction", action("increment"));
		await fireEvent(handle, "accessibilityAction", action("reset"));
		expect(onLayoutChange).not.toHaveBeenCalled();
	});

	test("a handle's own isDisabled freezes that seam", async () => {
		const onLayoutChange = jest.fn();
		await renderWithProviders(<Two handleDisabled onLayoutChange={onLayoutChange} />);
		const handle = screen.getByRole("adjustable");
		expect(handle).toBeDisabled();
		await fireEvent(handle, "accessibilityAction", action("increment"));
		expect(onLayoutChange).not.toHaveBeenCalled();
	});

	test("vertical and panes variants keep the same accessible surface", async () => {
		await renderWithProviders(
			<Splitter orientation="vertical" variant="panes" defaultLayout={[40, 60]}>
				<Splitter.Pane />
				<Splitter.Handle accessibilityLabel="Resize editor" />
				<Splitter.Pane />
			</Splitter>
		);
		expect(screen.getByRole("adjustable", { name: "Resize editor" })).toHaveAccessibilityValue({ now: 40 });
	});

	test("three panes: each handle moves only its own seam", async () => {
		const onLayoutChange = jest.fn();
		await renderWithProviders(
			<Splitter defaultLayout={[30, 30, 40]} onLayoutChange={onLayoutChange}>
				<Splitter.Pane />
				<Splitter.Handle accessibilityLabel="First" />
				<Splitter.Pane />
				<Splitter.Handle accessibilityLabel="Second" />
				<Splitter.Pane />
			</Splitter>
		);
		await fireEvent(screen.getByRole("adjustable", { name: "Second" }), "accessibilityAction", action("increment"));
		expect(onLayoutChange).toHaveBeenLastCalledWith([30, 35, 35]);
	});

	test("useSplitter hands a custom child the layout and togglePane, setLayout, reset", async () => {
		function Controls() {
			const { layout, setLayout, togglePane, reset } = useSplitter();
			return (
				<>
					<Text testID="readout">{layout.join("/")}</Text>
					<Text onPress={() => togglePane(0)}>toggle</Text>
					<Text onPress={() => setLayout([60, 40])}>set</Text>
					<Text onPress={reset}>reset</Text>
				</>
			);
		}
		await renderWithProviders(
			<Splitter defaultLayout={[30, 70]}>
				<Splitter.Pane isCollapsible minSize={20}>
					<Controls />
				</Splitter.Pane>
				<Splitter.Handle />
				<Splitter.Pane />
			</Splitter>
		);
		expect(screen.getByTestId("readout")).toHaveTextContent("30/70");
		await fireEvent.press(screen.getByText("set"));
		expect(screen.getByTestId("readout")).toHaveTextContent("60/40");
		await fireEvent.press(screen.getByText("reset"));
		expect(screen.getByTestId("readout")).toHaveTextContent("30/70");
		await fireEvent.press(screen.getByText("toggle"));
		expect(screen.getByTestId("readout", { includeHiddenElements: true })).toHaveTextContent("0/100");
	});

	test("a part outside a Splitter throws its documented error", async () => {
		const original = console.error;
		console.error = () => {};
		try {
			await expect(renderWithProviders(<Splitter.Handle />)).rejects.toThrow(
				"Splitter.Handle must be rendered inside a <Splitter>."
			);
			await expect(renderWithProviders(<Splitter.Pane />)).rejects.toThrow(
				"Splitter.Pane must be rendered inside a <Splitter>."
			);
			function Probe() {
				useSplitter();
				return null;
			}
			await expect(renderWithProviders(<Probe />)).rejects.toThrow("useSplitter must be called inside a <Splitter>.");
		} finally {
			console.error = original;
		}
	});

	describe("drag", () => {
		async function mountMeasured(onLayoutChange: (layout: SplitterLayout) => void, isDisabled = false) {
			await renderWithProviders(
				<Splitter defaultLayout={[30, 70]} isDisabled={isDisabled} onLayoutChange={onLayoutChange} testID="splitter">
					<Splitter.Pane minSize={20} />
					<Splitter.Handle />
					<Splitter.Pane minSize={20} />
				</Splitter>
			);
			await fireEvent(screen.getByTestId("splitter"), "layout", {
				nativeEvent: { layout: { height: 100, width: 200, x: 0, y: 0 } },
			});
		}

		test("a release reports the settled layout once, rounded to step", async () => {
			const onLayoutChange = jest.fn();
			await mountMeasured(onLayoutChange);
			await act(async () => {
				fireGestureHandler(getByGestureTestId("splitter-handle-0-pan"), [
					{ translationX: 0 },
					{ translationX: 20 },
					{ translationX: 20 },
				]);
			});
			expect(onLayoutChange).toHaveBeenCalledTimes(1);
			expect(onLayoutChange).toHaveBeenCalledWith([40, 60]);
		});

		test("a drag past minSize is held at the bound", async () => {
			const onLayoutChange = jest.fn();
			await mountMeasured(onLayoutChange);
			await act(async () => {
				fireGestureHandler(getByGestureTestId("splitter-handle-0-pan"), [
					{ translationX: 0 },
					{ translationX: -150 },
					{ translationX: -150 },
				]);
			});
			expect(onLayoutChange).toHaveBeenCalledWith([20, 80]);
		});

		test("a disabled splitter ignores a drag", async () => {
			const onLayoutChange = jest.fn();
			await mountMeasured(onLayoutChange, true);
			await act(async () => {
				fireGestureHandler(getByGestureTestId("splitter-handle-0-pan"), [
					{ translationX: 0 },
					{ translationX: 20 },
					{ translationX: 20 },
				]);
			});
			expect(onLayoutChange).not.toHaveBeenCalled();
		});

		test("a double tap resets to the starting layout", async () => {
			const onLayoutChange = jest.fn();
			await mountMeasured(onLayoutChange);
			await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", action("increment"));
			expect(onLayoutChange).toHaveBeenLastCalledWith([35, 65]);
			await act(async () => {
				fireGestureHandler(getByGestureTestId("splitter-handle-0-reset"), [{ state: 2 }, { state: 4 }, { state: 5 }]);
			});
			expect(onLayoutChange).toHaveBeenLastCalledWith([30, 70]);
		});
	});
});
