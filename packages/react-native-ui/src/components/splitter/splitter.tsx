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
import { type LayoutChangeEvent, View, type ViewProps } from "react-native";
import {
	cancelAnimation,
	useAnimatedReaction,
	useReducedMotion,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { useControllableState } from "../../hooks/use-controllable-state";
import type { HapticFeedback } from "../pressable";
import { SplitterIndexProvider, type SplitterPartContextValue, SplitterProvider } from "./splitter.context";
import type { SplitterSlotProps } from "./splitter.types";
import {
	describeSplitterChildren,
	fitLayout,
	isLayoutValid,
	layoutsEqual,
	lerpLayout,
	resolveCollapseToggle,
	resolveInitialLayout,
	resolveSplitterStep,
	SPLITTER_DEFAULT_ORIENTATION,
	SPLITTER_DEFAULT_VARIANT,
	SPLITTER_PANES_GAP,
	SPLITTER_SETTLE_SPRING,
	type SplitterChildKind,
	type SplitterLayout,
	type SplitterOrientation,
	type SplitterPaneConstraints,
	type SplitterVariant,
	splitterVariants,
} from "./splitter.variants";
import { SplitterHandle } from "./splitter-handle";
import { SplitterPane, type SplitterPaneProps } from "./splitter-pane";

export type SplitterProps = Omit<ViewProps, "children" | "style"> &
	SplitterSlotProps & {
		/** `horizontal` lays panes side by side and drags along x; `vertical` stacks them and drags along y. */
		orientation?: SplitterOrientation;
		/** Controlled layout, percent per pane. Its length must equal the pane count. */
		layout?: SplitterLayout;
		/** Initial layout while uncontrolled. Defaults to each pane's `defaultSize`, the rest shared equally. */
		defaultLayout?: SplitterLayout;
		/** Fires once when a drag, an assistive step, a collapse or a reset settles. Never per frame. */
		onLayoutChange?: (layout: SplitterLayout) => void;
		/** `seam` is a hairline between flush panes; `panes` gives each pane a rounded surface with a gap. */
		variant?: SplitterVariant;
		/** Freezes every handle. A handle's own `isDisabled` freezes one seam. */
		isDisabled?: boolean;
		/** Percent. What one assistive increment moves a seam by, and what a release rounds to. Default 5. */
		step?: number;
		/** Played when a seam meets a bound or a pane collapses. `false` silences it. */
		haptic?: false | HapticFeedback;
		/** Alternating `Splitter.Pane` and `Splitter.Handle`, starting and ending with a pane. */
		children: ReactNode;
	};

function kindOf(child: ReactNode): SplitterChildKind {
	if (!isValidElement(child)) return "other";
	if (child.type === SplitterPane) return "pane";
	if (child.type === SplitterHandle) return "handle";
	return "other";
}

function constraintsOf(child: ReactElement<SplitterPaneProps>): SplitterPaneConstraints {
	const { defaultSize, minSize, maxSize, isCollapsible, collapsedSize } = child.props;
	return { collapsedSize, defaultSize, isCollapsible, maxSize, minSize };
}

function SplitterRoot({
	orientation = SPLITTER_DEFAULT_ORIENTATION,
	layout: controlledLayout,
	defaultLayout,
	onLayoutChange,
	variant = SPLITTER_DEFAULT_VARIANT,
	isDisabled = false,
	step: stepProp,
	haptic = "light",
	className,
	onLayout,
	children,
	...props
}: SplitterProps): ReactElement {
	const items = Children.toArray(children);
	const kinds = items.map(kindOf);
	const paneConstraints = items.flatMap((child, index) =>
		kinds[index] === "pane" ? [constraintsOf(child as ReactElement<SplitterPaneProps>)] : []
	);

	// Pane props arrive as a fresh array every render. Keyed on their content, so
	// the handles' gestures are rebuilt when a limit changes and not on every render.
	const constraintsKey = JSON.stringify(paneConstraints);
	// biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the serialised content, see above
	const constraints = useMemo(() => paneConstraints, [constraintsKey]);

	const step = resolveSplitterStep(stepProp);
	const gap = variant === "panes" ? SPLITTER_PANES_GAP : 0;
	const reduceMotion = useReducedMotion();

	// `defaultLayout` is read once, like every default; only the pane limits re-run it.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	const initialLayout = useMemo(() => resolveInitialLayout(constraints, defaultLayout), [constraints]);

	const [current, setCurrent] = useControllableState<SplitterLayout>({
		defaultValue: initialLayout,
		onChange: onLayoutChange,
		value: controlledLayout,
	});
	const layout = useMemo(() => resolveInitialLayout(constraints, current), [constraints, current]);

	const sizes = useSharedValue<number[]>(layout);
	const extent = useSharedValue(0);
	const from = useSharedValue<number[]>(layout);
	const to = useSharedValue<number[]>(layout);
	const progress = useSharedValue(1);

	useAnimatedReaction(
		() => progress.value,
		(t, previous) => {
			if (previous === null) return;
			sizes.value = lerpLayout(from.value, to.value, t);
		}
	);

	const interrupt = useCallback(() => {
		"worklet";
		cancelAnimation(progress);
	}, [progress]);

	const settle = useCallback(
		(next: SplitterLayout) => {
			"worklet";
			cancelAnimation(progress);
			to.value = next;
			if (reduceMotion) {
				sizes.value = [...next];
				return;
			}
			from.value = [...sizes.value];
			progress.value = 0;
			progress.value = withSpring(1, SPLITTER_SETTLE_SPRING);
		},
		[from, progress, reduceMotion, sizes, to]
	);

	// Bumped on every release, purely so the sync below re-runs: a controlled parent
	// that rejects a dragged layout leaves `layout` unchanged, and without a token
	// that moves the panes would stay where the finger let go.
	const [settledDrags, setSettledDrags] = useState(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `settledDrags` is the re-run trigger, see above
	useEffect(() => {
		if (!layoutsEqual(to.value, layout)) settle(layout);
	}, [layout, settle, settledDrags, to]);

	const commitDrag = useCallback(
		(next: SplitterLayout) => {
			setSettledDrags((count) => count + 1);
			setCurrent(next);
		},
		[setCurrent]
	);

	const apply = useCallback(
		(next: SplitterLayout) => {
			settle(next);
			setCurrent(next);
		},
		[setCurrent, settle]
	);

	const setLayout = useCallback(
		(next: SplitterLayout) => {
			const fitted = fitLayout(next, constraints);
			if (!layoutsEqual(fitted, layout)) apply(fitted);
		},
		[apply, constraints, layout]
	);

	const togglePane = useCallback(
		(index: number) => {
			const next = resolveCollapseToggle({ constraints, index, layout });
			if (next !== layout) apply(next);
		},
		[apply, constraints, layout]
	);

	const reset = useCallback(() => {
		if (!layoutsEqual(initialLayout, layout)) apply(initialLayout);
	}, [apply, initialLayout, layout]);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			extent.value = orientation === "vertical" ? height : width;
			onLayout?.(event);
		},
		[extent, onLayout, orientation]
	);

	const childProblem = describeSplitterChildren(kinds);
	const warned = useRef<string | null>(null);
	useEffect(() => {
		if (process.env.NODE_ENV === "production") return;
		const layoutProblem =
			controlledLayout !== undefined && !isLayoutValid(controlledLayout, constraints.length)
				? `Splitter: layout must be one finite percentage per pane (${constraints.length}), summing to 100.`
				: defaultLayout !== undefined && !isLayoutValid(defaultLayout, constraints.length)
					? `Splitter: defaultLayout must be one finite percentage per pane (${constraints.length}), summing to 100.`
					: null;
		const problem = childProblem ?? layoutProblem;
		if (problem && warned.current !== problem) console.warn(problem);
		warned.current = problem;
	}, [childProblem, constraints.length, controlledLayout, defaultLayout]);

	const context = useMemo<SplitterPartContextValue>(
		() => ({
			apply,
			commitDrag,
			constraints,
			extent,
			gap,
			haptic,
			interrupt,
			isDisabled,
			layout,
			orientation,
			reset,
			setLayout,
			settle,
			sizes,
			step,
			togglePane,
			variant,
		}),
		[
			apply,
			commitDrag,
			constraints,
			extent,
			gap,
			haptic,
			interrupt,
			isDisabled,
			layout,
			orientation,
			reset,
			setLayout,
			settle,
			sizes,
			step,
			togglePane,
			variant,
		]
	);

	let paneIndex = -1;
	const indexed = items.map((child, index) => {
		if (kinds[index] === "pane") paneIndex++;
		const key = isValidElement(child) && child.key !== null ? child.key : index;
		return (
			<SplitterIndexProvider key={key} value={Math.max(paneIndex, 0)}>
				{child}
			</SplitterIndexProvider>
		);
	});

	return (
		<SplitterProvider value={context}>
			<View
				className={splitterVariants({ orientation, variant }).root({ className })}
				onLayout={handleLayout}
				{...props}
			>
				{indexed}
			</View>
		</SplitterProvider>
	);
}

/**
 * Two or more panes in one box, with a draggable handle on every seam.
 *
 * Sizes are **percentages of the box**, so a layout dragged in portrait is the
 * same layout in landscape — nothing stores points, and a rotation only
 * re-measures the box. The root must be given an extent by its parent (`flex-1`
 * or a fixed height); the percentages need something to divide.
 *
 * Children alternate `Splitter.Pane` and `Splitter.Handle`, starting and ending
 * with a pane. Each pane's limits are read off its props in render, so there is
 * no registration and no first frame with the wrong bounds.
 *
 * **A drag never round-trips to JS.** Panes grow from one shared value on the UI
 * thread; `onLayoutChange` fires once, when the drag, an assistive step, a
 * collapse or a reset settles. Pass `layout` to control it, or nothing and let
 * it hold its own.
 *
 * `useSplitter()` reads the settled layout from any descendant, with
 * `setLayout`, `togglePane` and `reset` — the way a sidebar button collapses
 * the sidebar.
 *
 * @example
 * ```tsx
 * <Splitter className="h-96" defaultLayout={[35, 65]} onLayoutChange={save}>
 * 	<Splitter.Pane isCollapsible maxSize={50} minSize={20}>
 * 		<Sidebar />
 * 	</Splitter.Pane>
 * 	<Splitter.Handle accessibilityLabel="Resize sidebar" />
 * 	<Splitter.Pane minSize={40}>
 * 		<Detail />
 * 	</Splitter.Pane>
 * </Splitter>
 * ```
 *
 * @example
 * ```tsx
 * <Splitter className="flex-1" orientation="vertical" variant="panes">
 * 	<Splitter.Pane><Editor /></Splitter.Pane>
 * 	<Splitter.Handle accessibilityLabel="Resize editor" />
 * 	<Splitter.Pane><Preview /></Splitter.Pane>
 * </Splitter>
 * ```
 */
export const Splitter = Object.assign(SplitterRoot, {
	/** One region of the box, sized in percent, with optional floor, ceiling and collapse. */
	Pane: SplitterPane,
	/** The draggable, adjustable seam between the pane before it and the pane after it. */
	Handle: SplitterHandle,
	displayName: "DelacourUI.Splitter",
});
