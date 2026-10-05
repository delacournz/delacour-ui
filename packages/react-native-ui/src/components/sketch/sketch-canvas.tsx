import { Canvas, Group, Path, Picture, Skia } from "@shopify/react-native-skia";
import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo } from "react";
import { type AccessibilityActionEvent, type LayoutChangeEvent, StyleSheet, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { useSketchPart } from "./sketch.context";
import {
	appendSketchSegment,
	buildSketchShapePath,
	finishSketchPath,
	type SketchPathState,
	type SketchPoint,
	type SketchShape,
	startSketchPath,
} from "./sketch.paths";
import { recordSketchPicture } from "./sketch.skia";
import type { SketchCommit } from "./sketch.types";
import { resolveSketchAccessibilityLabel, sketchVariants } from "./sketch.variants";

export type SketchCanvasProps = Omit<ViewProps, "children"> & {
	/** Painted under the marks, on screen only — an image being annotated, or an empty-state hint. */
	children?: ReactNode;
};

/** What the live stroke is. `none` between strokes. */
const LIVE_NONE = 0;
const LIVE_INK = 1;
const LIVE_ERASE = 2;

const ACCESSIBILITY_ACTIONS = [
	{ label: "Undo", name: "undo" },
	{ label: "Clear", name: "clear" },
];

/**
 * The drawing surface: the committed marks, the live stroke, and the pan.
 *
 * **The stroke never touches the JS thread until it ends.** `onBegin` starts a
 * path, `onUpdate` appends one quadratic segment per sample as a string, and a
 * derived value turns that string into the Skia path the live `Path` draws.
 * `onFinalize` hands the finished path to React once, which mints the id and
 * appends the item.
 *
 * **`onBegin`, not `onStart`, starts the stroke.** A pan activates on movement,
 * so a finger that lands and lifts never reaches `onStart` — and a pen tap has to
 * leave a dot. `onFinalize` is the one callback every path through the gesture
 * reaches, so it is where the stroke commits.
 *
 * **The tool is read once, at touch-down.** Tool, shape, ink and width live in
 * the root's shared values — written by the setters themselves, so a stroke
 * begun the instant after a tap already has the new tool — and the pan copies
 * them into the stroke at `onBegin`, so a swatch tapped mid-stroke with another
 * finger cannot split the stroke in two colours.
 *
 * **The live path is cleared after the commit renders**, not in the worklet. A
 * worklet clear lands a frame before React draws the committed copy, which is a
 * frame of missing ink; clearing late is a frame of the same ink drawn twice,
 * which is invisible. A sequence number keeps that late clear off a stroke that
 * began in between.
 *
 * **The eraser is paint order.** The committed marks are one recorded picture —
 * see `recordSketchPicture` — in which an erase is a `Clear` stroke over the
 * marks before it. The live eraser is one more `Clear` path in the same layer,
 * after the picture, so it cuts committed ink only; the live ink path sits
 * outside the layer and is never erased while it is being drawn.
 *
 * Until it has been measured the canvas is 0×0 and the pan is disabled: a stroke
 * on an unmeasured canvas would export into a `0 0 0 0` viewBox.
 */
export function SketchCanvas({ children, className, onLayout, ...props }: SketchCanvasProps): ReactElement {
	const { items, shape, brush, isDisabled, commit, canvasSize, setCanvasSize, handle } = useSketchPart("Sketch.Canvas");
	const { tool: toolValue, shape: shapeValue, ink: inkValue, size: sizeValue } = brush;

	/** Whether a stroke is under the finger, and which layer it draws in. */
	const liveKind = useSharedValue(LIVE_NONE);
	/** Which layer the live path is shown in. Set at touch-down, kept after release. */
	const liveLayer = useSharedValue(LIVE_INK);
	const liveD = useSharedValue("");
	const liveColor = useSharedValue("");
	const liveWidth = useSharedValue(0);
	const liveShape = useSharedValue<SketchShape>(shape);
	const liveFrom = useSharedValue<SketchPoint>({ x: 0, y: 0 });
	const livePath = useSharedValue<SketchPathState | null>(null);
	const strokeSeq = useSharedValue(0);
	const committedSeq = useSharedValue(0);

	const isMeasured = canvasSize.width > 0 && canvasSize.height > 0;

	const handleCommit = useCallback(
		(stroke: SketchCommit, seq: number) => {
			commit(stroke);
			// Read back by the effect below once the committed copy has rendered.
			committedSeq.value = seq;
		},
		[commit, committedSeq]
	);

	// Runs after the render that drew the new item, so the live copy can go.
	// biome-ignore lint/correctness/useExhaustiveDependencies: `items` is the trigger — the render that drew the commit
	useEffect(() => {
		const seq = committedSeq.value;
		scheduleOnUI(() => {
			"worklet";
			if (strokeSeq.value !== seq || liveKind.value !== LIVE_NONE) return;
			liveD.value = "";
		});
	}, [items, committedSeq, liveD, liveKind, strokeSeq]);

	const gesture = useMemo(
		() =>
			Gesture.Pan()
				.enabled(!isDisabled && isMeasured)
				.minDistance(0)
				.maxPointers(1)
				.shouldCancelWhenOutside(false)
				.onBegin((event) => {
					"worklet";
					const point = { x: event.x, y: event.y };
					strokeSeq.value += 1;
					const current = toolValue.value;
					liveWidth.value = sizeValue.value;
					liveFrom.value = point;

					if (current === "shape") {
						if (inkValue.value === "") {
							liveKind.value = LIVE_NONE;
							return;
						}
						liveKind.value = LIVE_INK;
						liveLayer.value = LIVE_INK;
						liveColor.value = inkValue.value;
						liveShape.value = shapeValue.value;
						livePath.value = null;
						liveD.value = "";
						return;
					}

					if (current === "pen" && inkValue.value === "") {
						liveKind.value = LIVE_NONE;
						return;
					}

					liveKind.value = current === "eraser" ? LIVE_ERASE : LIVE_INK;
					liveLayer.value = liveKind.value;
					liveColor.value = inkValue.value;
					const started = startSketchPath(point);
					livePath.value = started;
					liveD.value = finishSketchPath(started);
				})
				.onUpdate((event) => {
					"worklet";
					if (liveKind.value === LIVE_NONE) return;
					const point = { x: event.x, y: event.y };
					const path = livePath.value;
					if (path === null) {
						liveD.value = buildSketchShapePath(liveShape.value, liveFrom.value, point, liveWidth.value) ?? "";
						return;
					}
					const next = appendSketchSegment(path, point);
					if (next === path) return;
					livePath.value = next;
					liveD.value = finishSketchPath(next);
				})
				.onFinalize(() => {
					"worklet";
					const kind = liveKind.value;
					liveKind.value = LIVE_NONE;
					const d = liveD.value;
					const path = livePath.value;
					livePath.value = null;
					if (kind === LIVE_NONE || d === "") return;

					const seq = strokeSeq.value;
					const width = liveWidth.value;
					if (kind === LIVE_ERASE) {
						scheduleOnRN(handleCommit, { d, kind: "erase", width }, seq);
						return;
					}
					if (path === null) {
						scheduleOnRN(
							handleCommit,
							{ color: liveColor.value, d, kind: "shape", shape: liveShape.value, width },
							seq
						);
						return;
					}
					scheduleOnRN(handleCommit, { color: liveColor.value, d, kind: "stroke", width }, seq);
				}),
		[
			handleCommit,
			inkValue,
			isDisabled,
			isMeasured,
			liveColor,
			liveD,
			liveFrom,
			liveKind,
			liveLayer,
			livePath,
			liveShape,
			liveWidth,
			shapeValue,
			sizeValue,
			strokeSeq,
			toolValue,
		]
	);

	// The layer outlives the stroke on purpose: after release the live path stays
	// up until the committed copy renders, and it has to stay in the layer it was
	// drawn in — an erase must not flash up as ink for that frame.
	const inkPath = useDerivedValue(() =>
		liveLayer.value === LIVE_INK && liveD.value !== ""
			? (Skia.Path.MakeFromSVGString(liveD.value) ?? Skia.Path.Make())
			: Skia.Path.Make()
	);
	const eraserPath = useDerivedValue(() =>
		liveLayer.value === LIVE_ERASE && liveD.value !== ""
			? (Skia.Path.MakeFromSVGString(liveD.value) ?? Skia.Path.Make())
			: Skia.Path.Make()
	);
	const inkColor = useDerivedValue(() => (liveColor.value === "" ? "transparent" : liveColor.value));

	const { width, height } = canvasSize;
	const picture = useMemo(() => recordSketchPicture(items, { height, width }), [items, height, width]);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			setCanvasSize({ height, width });
			onLayout?.(event);
		},
		[onLayout, setCanvasSize]
	);

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (isDisabled) return;
			if (event.nativeEvent.actionName === "undo") handle.undo();
			if (event.nativeEvent.actionName === "clear") handle.clear();
		},
		[handle, isDisabled]
	);

	// The caller's children sit under the Skia canvas, so an image being annotated
	// is drawn on; the layer keeps every `Clear` inside the marks.
	return (
		<GestureDetector gesture={gesture}>
			<View
				accessibilityActions={ACCESSIBILITY_ACTIONS}
				accessibilityLabel={resolveSketchAccessibilityLabel(items)}
				accessibilityRole="image"
				accessible
				className={sketchVariants().canvas({ className })}
				onAccessibilityAction={handleAccessibilityAction}
				onLayout={handleLayout}
				{...props}
			>
				{children}
				<Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
					<Group layer>
						<Picture picture={picture} />
						<Path
							blendMode="clear"
							path={eraserPath}
							strokeCap="round"
							strokeJoin="round"
							strokeWidth={liveWidth}
							style="stroke"
						/>
					</Group>
					<Path
						color={inkColor}
						path={inkPath}
						strokeCap="round"
						strokeJoin="round"
						strokeWidth={liveWidth}
						style="stroke"
					/>
				</Canvas>
			</View>
		</GestureDetector>
	);
}
SketchCanvas.displayName = "DelacourUI.Sketch.Canvas";
