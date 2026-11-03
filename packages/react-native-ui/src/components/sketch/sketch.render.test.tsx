import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { createRef } from "react";
import { AccessibilityInfo } from "react-native";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { Sketch } from "./sketch";
import type { SketchItem } from "./sketch.paths";
import type { SketchHandle } from "./sketch.types";
import { SKETCH_PAN_TEST_ID } from "./sketch-canvas";

const COLORS = ["#111111", "#ef4444", "#3b82f6"] as const;

const MARK: SketchItem = { color: "#111111", d: "M 0 0 L 10 10", id: "a", kind: "stroke", width: 4 };
const MARK_TWO: SketchItem = { color: "#ef4444", d: "M 5 5 L 20 20", id: "b", kind: "stroke", width: 4 };

/** The first mark of the first `onChange` call, which a test expects to exist. */
function firstCommitted(onChange: jest.Mock): SketchItem {
	const items = onChange.mock.calls[0]?.[0] as readonly SketchItem[] | undefined;
	const first = items?.[0];
	if (first === undefined) throw new Error("onChange was not called with a mark");
	return first;
}

async function measure(): Promise<void> {
	await fireEvent(screen.getByRole("image"), "layout", {
		nativeEvent: { layout: { height: 300, width: 200, x: 0, y: 0 } },
	});
}

async function drawStroke(): Promise<void> {
	const pan = getByGestureTestId(SKETCH_PAN_TEST_ID);
	await act(async () => {
		fireGestureHandler(pan, [
			{ x: 10, y: 10 },
			{ x: 40, y: 40 },
			{ x: 80, y: 60 },
		]);
	});
}

describe("Sketch", () => {
	test("the canvas is an image named for its marks", async () => {
		await renderWithProviders(<Sketch colors={COLORS} />);
		expect(screen.getByRole("image", { name: "Drawing, empty" })).toBeOnTheScreen();
	});

	test("the label counts marks, singular and plural", async () => {
		const view = await renderWithProviders(<Sketch colors={COLORS} items={[MARK]} />);
		expect(screen.getByRole("image", { name: "Drawing, 1 mark" })).toBeOnTheScreen();
		await view.rerender(<Sketch colors={COLORS} items={[MARK, MARK_TWO]} />);
		expect(screen.getByRole("image", { name: "Drawing, 2 marks" })).toBeOnTheScreen();
	});

	test("with no children it lays out the canvas and the full toolbar", async () => {
		await renderWithProviders(<Sketch colors={COLORS} />);
		expect(screen.getByRole("togglebutton", { name: "Pen" })).toBeOnTheScreen();
		expect(screen.getByTestId("sketch-tool-shape")).toBeOnTheScreen();
		expect(screen.getByRole("togglebutton", { name: "Eraser" })).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Undo" })).toBeOnTheScreen();
		expect(screen.getByTestId("sketch-swatches")).toBeOnTheScreen();
		expect(screen.getByRole("adjustable", { name: "Stroke width" })).toBeOnTheScreen();
	});

	describe("tools", () => {
		test("the pen is selected by default and defaultTool seeds another", async () => {
			const view = await renderWithProviders(<Sketch colors={COLORS} />);
			expect(screen.getByRole("togglebutton", { name: "Pen" })).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: true })
			);
			expect(screen.getByRole("togglebutton", { name: "Eraser" })).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: false })
			);
			await view.rerender(<Sketch colors={COLORS} key="eraser" defaultTool="eraser" />);
			expect(screen.getByRole("togglebutton", { name: "Eraser" })).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: true })
			);
		});

		test("uncontrolled: activating a tool selects it and reports it", async () => {
			const onToolChange = jest.fn();
			await renderWithProviders(<Sketch colors={COLORS} onToolChange={onToolChange} />);
			await fireEvent(screen.getByRole("togglebutton", { name: "Eraser" }), "accessibilityTap");
			expect(onToolChange).toHaveBeenLastCalledWith("eraser");
			expect(screen.getByRole("togglebutton", { name: "Eraser" })).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: true })
			);
			expect(screen.getByRole("togglebutton", { name: "Pen" })).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: false })
			);
		});

		test("controlled: reports the change and waits for the prop", async () => {
			const onToolChange = jest.fn();
			const view = await renderWithProviders(<Sketch colors={COLORS} onToolChange={onToolChange} tool="pen" />);
			await fireEvent(screen.getByRole("togglebutton", { name: "Eraser" }), "accessibilityTap");
			expect(onToolChange).toHaveBeenCalledWith("eraser");
			expect(screen.getByRole("togglebutton", { name: "Pen" })).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: true })
			);
			await view.rerender(<Sketch colors={COLORS} onToolChange={onToolChange} tool="eraser" />);
			expect(screen.getByRole("togglebutton", { name: "Eraser" })).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: true })
			);
		});

		test("the shape row appears only while the shape tool is in hand", async () => {
			await renderWithProviders(<Sketch colors={COLORS} />);
			expect(screen.queryByRole("togglebutton", { name: "Star" })).not.toBeOnTheScreen();
			await fireEvent(screen.getByTestId("sketch-tool-shape"), "accessibilityTap");
			expect(screen.getByRole("togglebutton", { name: "Star" })).toBeOnTheScreen();
			expect(screen.getByRole("togglebutton", { name: "Ellipse" })).toBeOnTheScreen();
		});

		test("the shapes prop chooses and orders the offered shapes", async () => {
			await renderWithProviders(<Sketch colors={COLORS} defaultTool="shape" shapes={["star", "arrow"]} />);
			expect(screen.getByRole("togglebutton", { name: "Star" })).toBeOnTheScreen();
			expect(screen.getByRole("togglebutton", { name: "Arrow" })).toBeOnTheScreen();
			expect(screen.queryByRole("togglebutton", { name: "Heart" })).not.toBeOnTheScreen();
		});

		test("picking a shape selects the shape tool and reports the shape", async () => {
			const onToolChange = jest.fn();
			const onShapeChange = jest.fn();
			await renderWithProviders(
				<Sketch colors={COLORS} defaultTool="shape" onShapeChange={onShapeChange} onToolChange={onToolChange} />
			);
			await fireEvent(screen.getByTestId("sketch-shape-star"), "accessibilityTap");
			expect(onShapeChange).toHaveBeenLastCalledWith("star");
			expect(onToolChange).toHaveBeenLastCalledWith("shape");
			expect(screen.getByTestId("sketch-shape-star")).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: true })
			);
			expect(screen.getByTestId("sketch-shape-arrow")).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: false })
			);
		});

		test("the one-button shape entry shows and names the current shape", async () => {
			await renderWithProviders(<Sketch colors={COLORS} defaultShape="heart" />);
			expect(screen.getByTestId("sketch-tool-shape")).toHaveAccessibleName("Heart");
			expect(screen.getByTestId("sketch-tool-shape")).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: false })
			);
			await fireEvent(screen.getByTestId("sketch-tool-shape"), "accessibilityTap");
			expect(screen.getByTestId("sketch-tool-shape")).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: true })
			);
		});

		test("controlled shape waits for the prop", async () => {
			const onShapeChange = jest.fn();
			const view = await renderWithProviders(
				<Sketch colors={COLORS} defaultTool="shape" onShapeChange={onShapeChange} shape="rectangle" />
			);
			await fireEvent(screen.getByTestId("sketch-shape-star"), "accessibilityTap");
			expect(onShapeChange).toHaveBeenCalledWith("star");
			expect(screen.getByTestId("sketch-shape-rectangle")).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: true })
			);
			await view.rerender(<Sketch colors={COLORS} defaultTool="shape" onShapeChange={onShapeChange} shape="star" />);
			expect(screen.getByTestId("sketch-shape-star")).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: true })
			);
		});
	});

	describe("colour", () => {
		test("swatches are radios, the first selected, named by position for literals", async () => {
			await renderWithProviders(<Sketch colors={COLORS} />);
			expect(screen.getByTestId("sketch-swatches")).toHaveProp("accessibilityRole", "radiogroup");
			expect(screen.getAllByRole("radio")).toHaveLength(3);
			expect(screen.getByRole("radio", { name: "Colour 1 of 3" })).toBeChecked();
			expect(screen.getByRole("radio", { name: "Colour 2 of 3" })).not.toBeChecked();
		});

		test("uncontrolled: choosing a swatch checks it and reports the colour", async () => {
			const onColorChange = jest.fn();
			await renderWithProviders(<Sketch colors={COLORS} onColorChange={onColorChange} />);
			await fireEvent(screen.getByRole("radio", { name: "Colour 2 of 3" }), "accessibilityTap");
			expect(onColorChange).toHaveBeenLastCalledWith("#ef4444");
			expect(screen.getByRole("radio", { name: "Colour 2 of 3" })).toBeChecked();
			expect(screen.getByRole("radio", { name: "Colour 1 of 3" })).not.toBeChecked();
		});

		test("defaultColor seeds the selection", async () => {
			await renderWithProviders(<Sketch colors={COLORS} defaultColor="#3b82f6" />);
			expect(screen.getByRole("radio", { name: "Colour 3 of 3" })).toBeChecked();
		});

		test("controlled: reports the change and waits for the prop", async () => {
			const onColorChange = jest.fn();
			const view = await renderWithProviders(<Sketch color="#111111" colors={COLORS} onColorChange={onColorChange} />);
			await fireEvent(screen.getByRole("radio", { name: "Colour 3 of 3" }), "accessibilityTap");
			expect(onColorChange).toHaveBeenCalledWith("#3b82f6");
			expect(screen.getByRole("radio", { name: "Colour 1 of 3" })).toBeChecked();
			await view.rerender(<Sketch color="#3b82f6" colors={COLORS} onColorChange={onColorChange} />);
			expect(screen.getByRole("radio", { name: "Colour 3 of 3" })).toBeChecked();
		});

		test("a token that resolves to nothing is not offered, and a repeat appears once", async () => {
			await renderWithProviders(<Sketch colors={["primary", "#111111", "#111111", "#ef4444"]} />);
			expect(screen.getAllByRole("radio")).toHaveLength(2);
		});

		test("trailing children render after the swatches", async () => {
			await renderWithProviders(
				<Sketch colors={COLORS}>
					<Sketch.Toolbar>
						<Sketch.Swatches>
							<Sketch.Tool accessibilityLabel="Custom colour" tool="pen" />
						</Sketch.Swatches>
					</Sketch.Toolbar>
				</Sketch>
			);
			expect(screen.getByRole("togglebutton", { name: "Custom colour" })).toBeOnTheScreen();
		});
	});

	describe("size", () => {
		test("the slider is adjustable and exposes the width", async () => {
			await renderWithProviders(<Sketch colors={COLORS} />);
			expect(screen.getByRole("adjustable", { name: "Stroke width" })).toHaveAccessibilityValue({
				max: 24,
				min: 1,
				now: 4,
			});
		});

		test("defaultSize, minSize and maxSize bound it", async () => {
			await renderWithProviders(<Sketch colors={COLORS} defaultSize={10} maxSize={12} minSize={2} />);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ max: 12, min: 2, now: 10 });
		});

		test("uncontrolled: an increment steps the width and reports it", async () => {
			const onSizeChange = jest.fn();
			await renderWithProviders(<Sketch colors={COLORS} onSizeChange={onSizeChange} />);
			await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", {
				nativeEvent: { actionName: "increment" },
			});
			expect(onSizeChange).toHaveBeenLastCalledWith(5);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 5 });
		});

		test("controlled: reports the change and waits for the prop", async () => {
			const onSizeChange = jest.fn();
			const view = await renderWithProviders(<Sketch colors={COLORS} onSizeChange={onSizeChange} size={6} />);
			await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", {
				nativeEvent: { actionName: "decrement" },
			});
			expect(onSizeChange).toHaveBeenCalledWith(5);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 6 });
			await view.rerender(<Sketch colors={COLORS} onSizeChange={onSizeChange} size={5} />);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 5 });
		});
	});

	describe("undo and the handle", () => {
		let announce: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibility>;
		beforeEach(() => {
			announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
		});
		afterEach(() => {
			announce.mockRestore();
		});

		test("Undo is disabled with nothing to undo", async () => {
			const onChange = jest.fn();
			await renderWithProviders(<Sketch colors={COLORS} onChange={onChange} />);
			const undo = screen.getByRole("button", { name: "Undo" });
			expect(undo).toBeDisabled();
			await fireEvent(undo, "accessibilityTap");
			expect(onChange).not.toHaveBeenCalled();
		});

		test("Undo removes the last mark, reports it and announces it", async () => {
			const onChange = jest.fn();
			await renderWithProviders(<Sketch colors={COLORS} defaultItems={[MARK, MARK_TWO]} onChange={onChange} />);
			const undo = screen.getByRole("button", { name: "Undo" });
			expect(undo).not.toBeDisabled();
			await fireEvent(undo, "accessibilityTap");
			expect(onChange).toHaveBeenLastCalledWith([MARK]);
			expect(announce).toHaveBeenCalledWith("Undone");
			expect(screen.getByRole("image", { name: "Drawing, 1 mark" })).toBeOnTheScreen();
		});

		test("controlled: undo reports and waits for the prop", async () => {
			const onChange = jest.fn();
			const view = await renderWithProviders(<Sketch colors={COLORS} items={[MARK, MARK_TWO]} onChange={onChange} />);
			await fireEvent(screen.getByRole("button", { name: "Undo" }), "accessibilityTap");
			expect(onChange).toHaveBeenCalledWith([MARK]);
			expect(screen.getByRole("image", { name: "Drawing, 2 marks" })).toBeOnTheScreen();
			await view.rerender(<Sketch colors={COLORS} items={[MARK]} onChange={onChange} />);
			expect(screen.getByRole("image", { name: "Drawing, 1 mark" })).toBeOnTheScreen();
		});

		test("the canvas exposes undo and clear as accessibility actions", async () => {
			const onChange = jest.fn();
			await renderWithProviders(<Sketch colors={COLORS} defaultItems={[MARK, MARK_TWO]} onChange={onChange} />);
			const canvas = screen.getByRole("image");
			expect(canvas.props.accessibilityActions).toEqual([
				{ label: "Undo", name: "undo" },
				{ label: "Clear", name: "clear" },
			]);
			await fireEvent(canvas, "accessibilityAction", { nativeEvent: { actionName: "undo" } });
			expect(onChange).toHaveBeenLastCalledWith([MARK]);
			await fireEvent(screen.getByRole("image"), "accessibilityAction", { nativeEvent: { actionName: "clear" } });
			expect(onChange).toHaveBeenLastCalledWith([]);
			expect(screen.getByRole("image", { name: "Drawing, empty" })).toBeOnTheScreen();
		});

		test("the ref handle undoes, clears and reports emptiness", async () => {
			const ref = createRef<SketchHandle>();
			await renderWithProviders(<Sketch colors={COLORS} defaultItems={[MARK, MARK_TWO]} ref={ref} />);
			expect(ref.current?.isEmpty()).toBe(false);
			await act(async () => ref.current?.undo());
			expect(screen.getByRole("image", { name: "Drawing, 1 mark" })).toBeOnTheScreen();
			await act(async () => ref.current?.clear());
			expect(ref.current?.isEmpty()).toBe(true);
			expect(screen.getByRole("image", { name: "Drawing, empty" })).toBeOnTheScreen();
		});

		test("toSVG has a 0 0 0 0 viewBox until measured, then the canvas size and the marks", async () => {
			const ref = createRef<SketchHandle>();
			await renderWithProviders(<Sketch colors={COLORS} defaultItems={[MARK]} ref={ref} />);
			expect(ref.current?.toSVG()).toContain('viewBox="0 0 0 0"');
			await measure();
			const svg = ref.current?.toSVG({ background: null }) ?? "";
			expect(svg).toContain('viewBox="0 0 200 300"');
			expect(svg).toContain("M 0 0 L 10 10");
		});

		test("toPNG is empty before the canvas is measured", async () => {
			const ref = createRef<SketchHandle>();
			await renderWithProviders(<Sketch colors={COLORS} ref={ref} />);
			await expect(ref.current?.toPNG()).resolves.toBe("");
		});
	});

	describe("isDisabled", () => {
		test("tools, swatches and undo are announced disabled and do nothing", async () => {
			const onToolChange = jest.fn();
			const onColorChange = jest.fn();
			const onChange = jest.fn();
			await renderWithProviders(
				<Sketch
					colors={COLORS}
					defaultItems={[MARK]}
					isDisabled
					onChange={onChange}
					onColorChange={onColorChange}
					onToolChange={onToolChange}
				/>
			);
			expect(screen.getByRole("togglebutton", { name: "Eraser" })).toBeDisabled();
			expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
			expect(screen.getByRole("radio", { name: "Colour 2 of 3" })).toBeDisabled();
			await fireEvent(screen.getByRole("togglebutton", { name: "Eraser" }), "accessibilityTap");
			await fireEvent(screen.getByRole("button", { name: "Undo" }), "accessibilityTap");
			await fireEvent(screen.getByRole("radio", { name: "Colour 2 of 3" }), "accessibilityTap");
			expect(onToolChange).not.toHaveBeenCalled();
			expect(onColorChange).not.toHaveBeenCalled();
			expect(onChange).not.toHaveBeenCalled();
		});

		test("the canvas keeps its marks but ignores undo and clear actions", async () => {
			const onChange = jest.fn();
			await renderWithProviders(<Sketch colors={COLORS} defaultItems={[MARK]} isDisabled onChange={onChange} />);
			await fireEvent(screen.getByRole("image"), "accessibilityAction", { nativeEvent: { actionName: "undo" } });
			await fireEvent(screen.getByRole("image"), "accessibilityAction", { nativeEvent: { actionName: "clear" } });
			expect(onChange).not.toHaveBeenCalled();
			expect(screen.getByRole("image", { name: "Drawing, 1 mark" })).toBeOnTheScreen();
		});

		test("the stroke width slider is disabled", async () => {
			await renderWithProviders(<Sketch colors={COLORS} isDisabled />);
			expect(screen.getByRole("adjustable")).toBeDisabled();
		});
	});

	describe("drawing", () => {
		test("a stroke on a measured canvas commits one mark with the brush's ink and width", async () => {
			const onChange = jest.fn();
			await renderWithProviders(<Sketch colors={COLORS} defaultColor="#ef4444" defaultSize={6} onChange={onChange} />);
			await measure();
			await drawStroke();
			expect(onChange).toHaveBeenCalledTimes(1);
			const items = onChange.mock.calls[0]?.[0] as readonly SketchItem[];
			expect(items).toHaveLength(1);
			expect(items[0]).toMatchObject({ color: "#ef4444", kind: "stroke", width: 6 });
			expect(screen.getByRole("image", { name: "Drawing, 1 mark" })).toBeOnTheScreen();
		});

		test("a swatch chosen just before a stroke is the stroke's ink", async () => {
			const onChange = jest.fn();
			await renderWithProviders(<Sketch colors={COLORS} onChange={onChange} />);
			await measure();
			await fireEvent(screen.getByRole("radio", { name: "Colour 3 of 3" }), "accessibilityTap");
			await drawStroke();
			expect(firstCommitted(onChange)).toMatchObject({ color: "#3b82f6" });
		});

		test("the eraser commits an erase mark", async () => {
			const onChange = jest.fn();
			await renderWithProviders(<Sketch colors={COLORS} defaultTool="eraser" onChange={onChange} />);
			await measure();
			await drawStroke();
			expect(firstCommitted(onChange)).toMatchObject({ kind: "erase" });
		});

		test("the shape tool commits a shape mark of the current shape", async () => {
			const onChange = jest.fn();
			await renderWithProviders(
				<Sketch colors={COLORS} defaultShape="ellipse" defaultTool="shape" onChange={onChange} />
			);
			await measure();
			await drawStroke();
			expect(firstCommitted(onChange)).toMatchObject({ kind: "shape", shape: "ellipse" });
		});

		test("an unmeasured canvas does not draw", async () => {
			const onChange = jest.fn();
			await renderWithProviders(<Sketch colors={COLORS} onChange={onChange} />);
			await drawStroke();
			expect(onChange).not.toHaveBeenCalled();
		});

		test("a disabled sketch does not draw", async () => {
			const onChange = jest.fn();
			await renderWithProviders(<Sketch colors={COLORS} isDisabled onChange={onChange} />);
			await measure();
			await drawStroke();
			expect(onChange).not.toHaveBeenCalled();
		});
	});

	describe("compound parts", () => {
		test("a custom layout renders the given parts in a row", async () => {
			await renderWithProviders(
				<Sketch colors={COLORS}>
					<Sketch.Canvas />
					<Sketch.Toolbar>
						<Sketch.Tool tool="pen" />
						<Sketch.Tool shape="arrow" tool="shape" />
						<Sketch.Undo />
					</Sketch.Toolbar>
				</Sketch>
			);
			expect(screen.getByRole("togglebutton", { name: "Pen" })).toBeOnTheScreen();
			expect(screen.getByRole("togglebutton", { name: "Arrow" })).toBeOnTheScreen();
			expect(screen.queryByRole("togglebutton", { name: "Eraser" })).not.toBeOnTheScreen();
			expect(screen.queryByTestId("sketch-swatches")).not.toBeOnTheScreen();
		});

		test("a shape button with its own shape selects only when that shape is current", async () => {
			await renderWithProviders(
				<Sketch colors={COLORS} defaultShape="arrow" defaultTool="shape">
					<Sketch.Toolbar>
						<Sketch.Tool shape="arrow" tool="shape" />
						<Sketch.Tool shape="star" tool="shape" />
					</Sketch.Toolbar>
				</Sketch>
			);
			expect(screen.getByRole("togglebutton", { name: "Arrow" })).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: true })
			);
			expect(screen.getByRole("togglebutton", { name: "Star" })).toHaveProp(
				"accessibilityState",
				expect.objectContaining({ checked: false })
			);
		});

		test("Sketch.Tool onPress runs and an accessibilityLabel replaces the name", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<Sketch colors={COLORS}>
					<Sketch.Toolbar>
						<Sketch.Tool accessibilityLabel="Marker" onPress={onPress} tool="pen" />
					</Sketch.Toolbar>
				</Sketch>
			);
			await fireEvent(screen.getByRole("togglebutton", { name: "Marker" }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("Sketch.Size takes its own accessibilityLabel", async () => {
			await renderWithProviders(
				<Sketch colors={COLORS}>
					<Sketch.Toolbar>
						<Sketch.Size accessibilityLabel="Thickness" />
					</Sketch.Toolbar>
				</Sketch>
			);
			expect(screen.getByRole("adjustable", { name: "Thickness" })).toBeOnTheScreen();
		});

		test.each([
			["Sketch.Canvas", <Sketch.Canvas key="c" />],
			["Sketch.Toolbar", <Sketch.Toolbar key="t" />],
			["Sketch.Tool", <Sketch.Tool key="p" tool="pen" />],
			["Sketch.Swatches", <Sketch.Swatches key="s" />],
			["Sketch.Size", <Sketch.Size key="z" />],
			["Sketch.Undo", <Sketch.Undo key="u" />],
		])("%s outside a Sketch throws its documented error", async (name, part) => {
			const original = console.error;
			console.error = () => undefined;
			try {
				await expect(renderWithProviders(part)).rejects.toThrow(`${name} must be rendered inside a <Sketch>.`);
			} finally {
				console.error = original;
			}
		});
	});
});
