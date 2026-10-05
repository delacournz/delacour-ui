import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { AccessibilityInfo, type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { cancelAnimation, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import { useControllableState } from "../../hooks/use-controllable-state";
import { type HapticFeedback, playHaptic } from "../pressable";
import { clamp } from "../splitter/splitter.math";
import { type SplitViewPartContextValue, SplitViewProvider } from "./split-view.context";
import type { SplitViewSlotProps } from "./split-view.types";
import {
	describeSplitViewChildren,
	formatSnapPosition,
	isSnapRangeFeasible,
	resolveInitialSnapIndex,
	resolveNextIndex,
	resolveSnapHeights,
	SPLIT_VIEW_DEFAULT_SNAP_POINTS,
	SPLIT_VIEW_DEFAULT_VARIANT,
	SPLIT_VIEW_DRAG_AREA_HEIGHT,
	SPLIT_VIEW_SPRING,
	type SplitViewChildKind,
	type SplitViewSnapPoint,
	type SplitViewVariant,
	sortSnapPoints,
	splitViewVariants,
} from "./split-view.variants";
import { SplitViewBottom } from "./split-view-bottom";
import { SplitViewDragArea } from "./split-view-drag-area";
import { SplitViewHandle } from "./split-view-handle";
import { SplitViewTop } from "./split-view-top";

export type SplitViewProps = Omit<ViewProps, "children" | "style"> &
	SplitViewSlotProps & {
		/** Stops for the top pane, in any order — sorted by height, deduped. `<= 1` is a fraction, `> 1` points. Default `[0.35, 0.65, 1]`. At least 2. */
		snapPoints?: readonly SplitViewSnapPoint[];
		/** Controlled index into the stops, ascending by height. */
		snapIndex?: number;
		/** Initial index when uncontrolled. Default: the middle stop. */
		defaultSnapIndex?: number;
		/** Fires when the settle target changes — on release, on an assistive action, on a tap of the grip. Never per frame. */
		onSnapIndexChange?: (index: number) => void;
		/** Floor for the top pane, points. Stops below it are lifted to it. Default 0. */
		minTopHeight?: number;
		/** Floor for the bottom pane, points. Stops that would crush it are lowered. Default 0. */
		minBottomHeight?: number;
		/** `panes`: two rounded surfaces with the drag row between. `seam`: flush panes joined by a hairline, for inside a `Card` or sheet. */
		variant?: SplitViewVariant;
		isDisabled?: boolean;
		/** Played when the settle target changes. `false` is silent. Default `"selection"`. */
		haptic?: false | HapticFeedback;
		/** Exactly `SplitView.Top`, `SplitView.DragArea`, `SplitView.Bottom`, in that order. */
		children: ReactNode;
	};

function kindOf(child: ReactNode): SplitViewChildKind {
	if (!isValidElement(child)) return "other";
	if (child.type === SplitViewTop) return "top";
	if (child.type === SplitViewDragArea) return "dragArea";
	if (child.type === SplitViewBottom) return "bottom";
	return "other";
}

function SplitViewRoot({
	snapPoints: snapPointsProp = SPLIT_VIEW_DEFAULT_SNAP_POINTS,
	snapIndex: controlledIndex,
	defaultSnapIndex,
	onSnapIndexChange,
	minTopHeight = 0,
	minBottomHeight = 0,
	variant = SPLIT_VIEW_DEFAULT_VARIANT,
	isDisabled = false,
	haptic = "selection",
	className,
	onLayout,
	children,
	...props
}: SplitViewProps): ReactElement {
	// A literal array arrives fresh every render; keyed on its content so the
	// heights, and the drag row's gesture, are rebuilt only when a stop changes.
	const pointsKey = snapPointsProp.join(",");
	// biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the content, see above
	const sorted = useMemo(() => sortSnapPoints(snapPointsProp), [pointsKey]);
	const points = sorted.success ? sorted.data : SPLIT_VIEW_DEFAULT_SNAP_POINTS;
	const snapCount = points.length;

	const [measured, setMeasured] = useState(0);
	const extent = useSharedValue(0);
	const heights = useMemo(
		() =>
			resolveSnapHeights({
				dragAreaHeight: SPLIT_VIEW_DRAG_AREA_HEIGHT,
				extent: measured,
				minBottom: minBottomHeight,
				minTop: minTopHeight,
				points,
			}),
		[measured, minBottomHeight, minTopHeight, points]
	);

	const [current, setCurrent] = useControllableState<number>({
		defaultValue: resolveInitialSnapIndex({ count: snapCount, defaultIndex: defaultSnapIndex }),
		onChange: onSnapIndexChange,
		value: controlledIndex,
	});
	const snapIndex = clamp(Math.round(current), 0, snapCount - 1);

	const reduceMotion = useReducedMotion();
	const top = useSharedValue(0);
	const [isActive, setActive] = useState(false);

	const interrupt = useCallback(() => {
		"worklet";
		cancelAnimation(top);
	}, [top]);

	const settle = useCallback(
		(index: number, velocity: number) => {
			"worklet";
			const height = heights[index];
			if (height === undefined) return;
			cancelAnimation(top);
			top.value = reduceMotion ? height : withSpring(height, { ...SPLIT_VIEW_SPRING, velocity });
		},
		[heights, reduceMotion, top]
	);

	// The stop the pane was last sent to, on the JS side. A drag has already
	// started the spring by the time it reports, so the sync below must not
	// restart it — that would throw away the finger's velocity.
	const settledIndex = useRef(snapIndex);
	// Bumped on every release so the sync re-runs even when a controlled parent
	// rejects the dragged stop and `snapIndex` does not move.
	const [settledDrags, setSettledDrags] = useState(0);
	const lastHeights = useRef(heights);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `settledDrags` is the re-run trigger, see above
	useEffect(() => {
		if (measured <= 0) return;
		if (lastHeights.current !== heights) {
			lastHeights.current = heights;
			cancelAnimation(top);
			top.value = heights[snapIndex] ?? 0;
			settledIndex.current = snapIndex;
			return;
		}
		if (settledIndex.current !== snapIndex) {
			settledIndex.current = snapIndex;
			settle(snapIndex, 0);
		}
	}, [heights, measured, settle, settledDrags, snapIndex, top]);

	const commitDrag = useCallback(
		(index: number) => {
			settledIndex.current = index;
			setSettledDrags((count) => count + 1);
			if (index !== snapIndex) setCurrent(index);
		},
		[setCurrent, snapIndex]
	);

	const snapTo = useCallback(
		(index: number) => {
			const next = clamp(Math.round(index), 0, snapCount - 1);
			if (next === snapIndex) return;
			setCurrent(next);
		},
		[setCurrent, snapCount, snapIndex]
	);

	const cycle = useCallback(
		(announce: boolean) => {
			const next = resolveNextIndex({ count: snapCount, direction: 1, index: snapIndex, wrap: true });
			if (next === snapIndex) return;
			if (haptic !== false) scheduleOnUI(playHaptic, haptic);
			setCurrent(next);
			if (!announce) return;
			AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
				if (enabled) AccessibilityInfo.announceForAccessibility(formatSnapPosition(next, snapCount));
			});
		},
		[haptic, setCurrent, snapCount, snapIndex]
	);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { height } = event.nativeEvent.layout;
			extent.value = height;
			setMeasured(height);
			onLayout?.(event);
		},
		[extent, onLayout]
	);

	const kinds = Children.toArray(children).map(kindOf);
	const problem =
		describeSplitViewChildren(kinds) ??
		(sorted.success ? null : sorted.error) ??
		(isSnapRangeFeasible({
			dragAreaHeight: SPLIT_VIEW_DRAG_AREA_HEIGHT,
			extent: measured,
			minBottom: minBottomHeight,
			minTop: minTopHeight,
		})
			? null
			: `SplitView: minTopHeight (${minTopHeight}) and minBottomHeight (${minBottomHeight}) do not both fit in ${measured}pt; showing both panes at half.`) ??
		(controlledIndex !== undefined && controlledIndex !== snapIndex
			? `SplitView: snapIndex ${controlledIndex} is outside 0..${snapCount - 1}; clamped to ${snapIndex}.`
			: null);
	const warned = useRef<string | null>(null);
	useEffect(() => {
		if (process.env.NODE_ENV === "production") return;
		if (problem && warned.current !== problem) console.warn(problem);
		warned.current = problem;
	}, [problem]);

	const context = useMemo<SplitViewPartContextValue>(
		() => ({
			commitDrag,
			cycle,
			extent,
			haptic,
			heights,
			interrupt,
			isActive,
			isDisabled,
			setActive,
			settle,
			snapCount,
			snapIndex,
			snapTo,
			top,
			variant,
		}),
		[
			commitDrag,
			cycle,
			extent,
			haptic,
			heights,
			interrupt,
			isActive,
			isDisabled,
			settle,
			snapCount,
			snapIndex,
			snapTo,
			top,
			variant,
		]
	);

	return (
		<SplitViewProvider value={context}>
			<View className={splitViewVariants({ variant }).root({ className })} onLayout={handleLayout} {...props}>
				{children}
			</View>
		</SplitViewProvider>
	);
}

/**
 * Two stacked panes with a drag row between them that settles on one of a few
 * named heights, flung there by the release velocity.
 *
 * The stops belong to the app — `[0.3, 0.6, 1]` — so the layout is always one a
 * designer intended and never a sliver. A stop `<= 1` is a fraction of the box
 * less the drag row; anything larger is points, and the two can be mixed. The
 * index into those stops, ascending by height, is the public value: pass
 * `snapIndex` to control it, or nothing and let it hold its own.
 *
 * The root needs an extent from its parent (`flex-1` or a fixed height): the
 * fractions need something to divide. Until it is measured both panes share the
 * box equally, so nothing flashes at a garbage height. A rotation re-resolves the
 * stops against the new box and keeps the index, without animating.
 *
 * **A drag never round-trips to JS.** The top pane's height is one shared value;
 * the bottom pane is `flex-1` and follows in the same layout pass.
 * `onSnapIndexChange` fires once per settle.
 *
 * Not a `BottomSheet` — nothing floats or dismisses — and not a `Splitter` —
 * exactly two panes, vertical, snapped. For side by side on a wide screen, render
 * a horizontal `Splitter` there instead; that switch is the app's call.
 *
 * @example
 * ```tsx
 * <SplitView className="flex-1" snapPoints={[0.3, 0.6, 1]} defaultSnapIndex={1}>
 * 	<SplitView.Top>
 * 		<ResultsMap />
 * 	</SplitView.Top>
 * 	<SplitView.DragArea accessibilityLabel="Resize map" />
 * 	<SplitView.Bottom>
 * 		<ResultsList />
 * 	</SplitView.Bottom>
 * </SplitView>
 * ```
 */
export const SplitView = Object.assign(SplitViewRoot, {
	/** The upper pane — its height is the one that moves. */
	Top: SplitViewTop,
	/** The 44pt row between the panes that drags, taps to cycle and is the adjustable element. */
	DragArea: SplitViewDragArea,
	/** The lower pane, `flex-1` — whatever the top and the drag row leave. */
	Bottom: SplitViewBottom,
	/** The grip capsule. `DragArea` renders one when given no children. */
	Handle: SplitViewHandle,
	displayName: "DelacourUI.SplitView",
});
