import {
	type ReactElement,
	type ReactNode,
	type Ref,
	useCallback,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { AccessibilityInfo, View, type ViewProps } from "react-native";
import { useCSSVariable } from "uniwind";
import { useControllableState } from "../../hooks/use-controllable-state";
import { themeVariableName } from "../../lib/color";
import type { HapticFeedback } from "../pressable";
import { type SketchContextValue, SketchProvider } from "./sketch.context";
import {
	SKETCH_SHAPES,
	type SketchItem,
	type SketchShape,
	type SketchTool,
	sketchItemsToSvg,
	undoSketchItems,
} from "./sketch.paths";
import type { SketchCanvasSize, SketchCommit, SketchExportOptions, SketchHandle } from "./sketch.types";
import {
	clampSketchSize,
	resolveSketchColor,
	resolveSketchExportBackground,
	resolveSketchSwatches,
	SKETCH_DEFAULT_COLORS,
	SKETCH_DEFAULT_SIZE,
	SKETCH_MAX_SIZE,
	SKETCH_MIN_SIZE,
	sketchTokenNames,
	sketchVariants,
} from "./sketch.variants";
import { SketchCanvas } from "./sketch-canvas";
import { SketchSize } from "./sketch-size";
import { SketchSwatches } from "./sketch-swatches";
import { SketchTool as SketchToolButton } from "./sketch-tool";
import { SketchToolbar } from "./sketch-toolbar";
import { SketchUndo } from "./sketch-undo";

export type SketchProps = Omit<ViewProps, "children"> & {
	/** Controlled marks. Pass `onChange` with it, or the drawing never changes. */
	items?: readonly SketchItem[];
	/** Starting marks while uncontrolled. */
	defaultItems?: readonly SketchItem[];
	/** Called with every mark after each stroke, undo and clear. */
	onChange?: (items: readonly SketchItem[]) => void;

	tool?: SketchTool;
	/** Default `"pen"`. */
	defaultTool?: SketchTool;
	onToolChange?: (tool: SketchTool) => void;

	shape?: SketchShape;
	/** Default `"rectangle"`. */
	defaultShape?: SketchShape;
	/** Which shapes the toolbar offers, in order. Default: all eight. */
	shapes?: readonly SketchShape[];
	onShapeChange?: (shape: SketchShape) => void;

	/** Theme tokens (`"foreground"`, `"primary"`) or literals (`"#ec4899"`). Default: the ink, then the five status hues. */
	colors?: readonly string[];
	color?: string;
	/** Default: the first colour. */
	defaultColor?: string;
	onColorChange?: (color: string) => void;

	/** Stroke width in points. */
	size?: number;
	/** Default `4`. */
	defaultSize?: number;
	/** Default `1`. */
	minSize?: number;
	/** Default `24`. */
	maxSize?: number;
	onSizeChange?: (size: number) => void;

	/** Blocks drawing, the tools and undo. The canvas keeps showing the marks at full strength. */
	isDisabled?: boolean;
	/** Played on a tool or colour change and on each undo. `false` silences it. Default `"selection"`. */
	haptic?: false | HapticFeedback;
	/** The imperative handle — `undo`, `clear`, `isEmpty`, `toSVG`. */
	ref?: Ref<SketchHandle>;
	/** Your own layout of `Sketch.Canvas` and `Sketch.Toolbar`. Omitted, both are rendered with every tool. */
	children?: ReactNode;
};

const EMPTY_ITEMS: readonly SketchItem[] = [];

/** Unique within a JS runtime, which is all an item id has to be: the drawing it sits in. */
let mintedIds = 0;
function mintSketchItemId(): string {
	mintedIds += 1;
	return `s${Date.now().toString(36)}${mintedIds.toString(36)}`;
}

function SketchRoot({
	items,
	defaultItems = EMPTY_ITEMS,
	onChange,
	tool,
	defaultTool = "pen",
	onToolChange,
	shape,
	defaultShape = "rectangle",
	shapes = SKETCH_SHAPES,
	onShapeChange,
	colors = SKETCH_DEFAULT_COLORS,
	color,
	defaultColor,
	onColorChange,
	size,
	defaultSize = SKETCH_DEFAULT_SIZE,
	minSize = SKETCH_MIN_SIZE,
	maxSize = SKETCH_MAX_SIZE,
	onSizeChange,
	isDisabled = false,
	haptic = "selection",
	ref,
	className,
	children,
	...props
}: SketchProps): ReactElement {
	const [currentItems, setItems] = useControllableState<readonly SketchItem[]>({
		defaultValue: defaultItems,
		onChange,
		value: items,
	});
	const [currentTool, setTool] = useControllableState<SketchTool>({
		defaultValue: defaultTool,
		onChange: onToolChange,
		value: tool,
	});
	const [currentShape, setShape] = useControllableState<SketchShape>({
		defaultValue: defaultShape,
		onChange: onShapeChange,
		value: shape,
	});
	const [currentColor, setColor] = useControllableState<string>({
		defaultValue: defaultColor ?? colors[0] ?? "foreground",
		onChange: onColorChange,
		value: color,
	});
	const [rawSize, setRawSize] = useControllableState<number>({
		defaultValue: defaultSize,
		onChange: onSizeChange,
		value: size,
	});
	const currentSize = clampSketchSize(rawSize, minSize, maxSize);
	const [canvasSize, setCanvasSize] = useState<SketchCanvasSize>({ height: 0, width: 0 });

	// One lookup for every token the sketch can paint with, because the swatch
	// count is data and a hook cannot run once per swatch. Uniwind takes an
	// array and answers in the same order.
	const tokenNames = useMemo(() => sketchTokenNames([...colors, currentColor]), [colors, currentColor]);
	const variableNames = useMemo(() => tokenNames.map(themeVariableName), [tokenNames]);
	const tokenValues = useCSSVariable(variableNames);
	const tokens = useMemo(() => {
		const record: Record<string, string | undefined> = {};
		tokenNames.forEach((name, index) => {
			const value = tokenValues[index];
			record[name] = typeof value === "string" ? value : undefined;
		});
		return record;
	}, [tokenNames, tokenValues]);

	const swatches = useMemo(() => resolveSketchSwatches(colors, tokens), [colors, tokens]);
	const ink = resolveSketchColor(currentColor, tokens);

	// The handle reads through refs, so it is one object for the sketch's life and
	// an export called from a stale closure still sees the drawing as it is now.
	const latest = useRef({ canvasSize, items: currentItems, tokens });
	latest.current = { canvasSize, items: currentItems, tokens };

	const commit = useCallback(
		(stroke: SketchCommit) => {
			// Written through to the ref as well as to state, so a second stroke that
			// lands before the render cannot append to the list the first one replaced.
			const next = [...latest.current.items, { ...stroke, id: mintSketchItemId() }];
			latest.current.items = next;
			setItems(next);
		},
		[setItems]
	);

	const handle = useMemo<SketchHandle>(
		() => ({
			clear: () => {
				if (latest.current.items.length === 0) return;
				latest.current.items = EMPTY_ITEMS;
				setItems(EMPTY_ITEMS);
			},
			isEmpty: () => latest.current.items.length === 0,
			toSVG: (options?: SketchExportOptions) => {
				const { canvasSize: measured, items: marks, tokens: resolved } = latest.current;
				return sketchItemsToSvg(marks, {
					background: resolveSketchExportBackground(options?.background, resolved),
					height: measured.height,
					width: measured.width,
				});
			},
			undo: () => {
				const next = undoSketchItems(latest.current.items);
				if (next === latest.current.items) return;
				latest.current.items = next;
				setItems(next);
				AccessibilityInfo.announceForAccessibility("Undone");
			},
		}),
		[setItems]
	);

	useImperativeHandle(ref, () => handle, [handle]);

	const context = useMemo<SketchContextValue>(
		() => ({
			canvasSize,
			color: currentColor,
			commit,
			handle,
			haptic,
			ink,
			isDisabled,
			items: currentItems,
			maxSize,
			minSize,
			setCanvasSize,
			setColor,
			setShape,
			setSize: setRawSize,
			setTool,
			shape: currentShape,
			shapes,
			size: currentSize,
			swatches,
			tool: currentTool,
		}),
		[
			canvasSize,
			commit,
			currentColor,
			currentItems,
			currentShape,
			currentSize,
			currentTool,
			handle,
			haptic,
			ink,
			isDisabled,
			maxSize,
			minSize,
			setColor,
			setRawSize,
			setShape,
			setTool,
			shapes,
			swatches,
		]
	);

	// With no children the sketch lays itself out: the canvas takes the room and
	// the full toolbar sits under it, so `<Sketch />` is a working drawing surface.
	return (
		<SketchProvider value={context}>
			<View className={sketchVariants().root({ className })} {...props}>
				{children ?? (
					<>
						<SketchCanvas />
						<SketchToolbar />
					</>
				)}
			</View>
		</SketchProvider>
	);
}

/**
 * A freehand drawing surface with its tools: a pen, eight shapes, an eraser,
 * colour swatches, a stroke width and undo — delivered as an SVG string.
 *
 * `<Sketch />` alone is the whole thing: a canvas that takes the room, with the
 * toolbar under it. Compose `Sketch.Canvas` and `Sketch.Toolbar` yourself to
 * move or trim the tools, or to draw over an image.
 *
 * **Strokes run on the UI thread.** One Gesture Handler pan builds the live path
 * as a string and draws it through an animated `Path`; React hears about a
 * stroke once, when it ends.
 *
 * **Ink is content, not chrome.** A mark stores the literal its colour resolved
 * to when it was drawn, so switching the theme does not recolour a drawing. The
 * export paints the theme's background behind it unless told otherwise, so the
 * file stays legible either way.
 *
 * **The eraser is a mask.** It hides the ink under it that was drawn before it,
 * and leaves a later stroke over the same spot alone. Undo removes an erase like
 * any other mark.
 *
 * Every axis — marks, tool, shape, colour, size — works controlled or
 * uncontrolled. A `ref` receives `undo`, `clear`, `isEmpty` and `toSVG`.
 *
 * @example
 * const sketch = useRef<SketchHandle>(null);
 *
 * <Sketch className="flex-1" ref={sketch} />
 * <Button onPress={() => save(sketch.current?.toSVG({ background: null }) ?? "")}>
 *   <Button.Label>Done</Button.Label>
 * </Button>
 *
 * @example
 * <Sketch className="flex-1">
 *   <Sketch.Canvas>
 *     <Image className="absolute inset-0" resizeMode="contain" source={photo} />
 *   </Sketch.Canvas>
 *   <Sketch.Toolbar>
 *     <Sketch.Tool tool="pen" />
 *     <Sketch.Tool shape="arrow" tool="shape" />
 *     <Sketch.Tool tool="eraser" />
 *     <Sketch.Swatches />
 *     <Sketch.Undo />
 *   </Sketch.Toolbar>
 * </Sketch>
 */
export const Sketch = Object.assign(SketchRoot, {
	/** The drawing surface. Children are painted under the marks — an image to annotate. */
	Canvas: SketchCanvas,
	/** The tool tray. Omitted children render every tool; given, they are laid out in a row. */
	Toolbar: SketchToolbar,
	/** One tool: the pen, the eraser, or a shape. */
	Tool: SketchToolButton,
	/** The colour swatches, as a radio group. */
	Swatches: SketchSwatches,
	/** The stroke-width slider. */
	Size: SketchSize,
	/** Removes the last mark. */
	Undo: SketchUndo,
	displayName: "DelacourUI.Sketch",
});
