import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
} from "react";
import { AccessibilityInfo, type ViewProps } from "react-native";
import Animated, {
	type AnimatedRef,
	measure,
	scrollTo,
	useAnimatedRef,
	useFrameCallback,
	useReducedMotion,
	useScrollOffset,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { playHaptic } from "../pressable";
import { type SortableContextValue, SortableProvider } from "./sortable.context";
import type { SortableDrag, SortableReorderDetails } from "./sortable.types";
import {
	clampAutoscrollStep,
	computeOffsets,
	reorderItems,
	resolveAutoscrollStep,
	resolveMoveAction,
	resolveShifts,
	resolveSortableHaptics,
	resolveSortablePosition,
	resolveTargetIndex,
	SORTABLE_DEFAULT_ACTIVATION,
	SORTABLE_DEFAULT_AUTOSCROLL_SPEED,
	SORTABLE_DEFAULT_AUTOSCROLL_THRESHOLD,
	SORTABLE_DEFAULT_LONG_PRESS_DELAY,
	SORTABLE_LIFT_DURATION,
	SORTABLE_SHIFT_SPRING,
	type SortableActivation,
	type SortableHaptic,
	type SortableMoveDirection,
	sortableVariants,
} from "./sortable.variants";
import { SortableHandle } from "./sortable-handle";
import { SortableItem, type SortableItemProps } from "./sortable-item";

/**
 * How long the list waits for the caller to render the order it was handed before it gives up and
 * drops the rows back where they were. A caller that rejects a move — by not storing it — still
 * gets a list that rests.
 */
const UNCOMMITTED_RESET_DELAY = 120;

export type SortableProps = Omit<ViewProps, "children"> & {
	/** Row ids in render order. Caller-owned: the list never reorders itself. */
	value: readonly string[];
	/** Called once per move, after the row has landed, with the new order and what moved. */
	onReorder: (order: string[], details: SortableReorderDetails) => void;
	/** Points between rows. Laid out by the list, so the drag math knows it. Default 0. */
	gap?: number;
	/** `handle` lifts from `Sortable.Handle`; `long-press` lifts the whole row after a hold. */
	activation?: SortableActivation;
	/** How long a row must be held in `long-press` mode, in milliseconds. Default 220. */
	longPressDelay?: number;
	/** The haptic on lift and on each slot passed. `false` silences both. Default `{ lift: "medium", pass: "selection" }`. */
	haptic?: false | SortableHaptic;
	/** No row can be lifted or moved. */
	isDisabled?: boolean;
	/** The enclosing scroller, for auto-scroll near its edges. */
	scrollRef?: AnimatedRef<Animated.ScrollView>;
	/** Points from the scroller's edge where auto-scroll starts. Default 72. */
	autoscrollThreshold?: number;
	/** Points per frame at the very edge, tapering to nothing at the threshold. Default 8. */
	autoscrollSpeed?: number;
	onDragStart?: (id: string) => void;
	onDragEnd?: (id: string) => void;
	className?: string;
	children: ReactNode;
};

function SortableRoot({
	value,
	onReorder,
	gap = 0,
	activation = SORTABLE_DEFAULT_ACTIVATION,
	longPressDelay = SORTABLE_DEFAULT_LONG_PRESS_DELAY,
	haptic,
	isDisabled = false,
	scrollRef,
	autoscrollThreshold = SORTABLE_DEFAULT_AUTOSCROLL_THRESHOLD,
	autoscrollSpeed = SORTABLE_DEFAULT_AUTOSCROLL_SPEED,
	onDragStart,
	onDragEnd,
	className,
	style,
	children,
	...props
}: SortableProps): ReactElement {
	const isReducedMotion = useReducedMotion();
	// Primitives, not the object: the worklets below close over them.
	const { lift: liftHaptic, pass: passHaptic } = resolveSortableHaptics(haptic);
	const rootRef = useAnimatedRef<Animated.View>();
	const scrollOffset = useScrollOffset(scrollRef ?? null);

	const pinnedById = useMemo(() => collectPinned(children), [children]);
	const pinned = useMemo(() => value.map((id) => pinnedById[id] === true), [pinnedById, value]);

	const order = useSharedValue<string[]>(value.slice());
	const pinnedValue = useSharedValue<boolean[]>(pinned);
	const heights = useSharedValue<Record<string, number>>({});
	const activeId = useSharedValue<string | null>(null);
	const phase = useSharedValue(0);
	const dragY = useSharedValue(0);
	const lift = useSharedValue(0);
	const shifts = useSharedValue<Record<string, number>>({});
	const startIndex = useSharedValue(0);
	const targetIndex = useSharedValue(0);
	const translation = useSharedValue(0);
	const startScroll = useSharedValue(0);
	const fingerY = useSharedValue(0);

	// The callbacks a landing calls, kept current without moving the gestures' identity. Only
	// dispatchers read these — nothing that answers a question during render.
	const callbacks = useRef({ onDragEnd, onDragStart, onReorder });
	const committed = useRef({ pinned, value });
	const isPending = useRef(false);
	useLayoutEffect(() => {
		callbacks.current = { onDragEnd, onDragStart, onReorder };
		committed.current = { pinned, value };
	});

	const reset = useCallback(() => {
		"worklet";
		// `phase` first: a row's shift reaction reads it to snap rather than spring back.
		phase.value = 0;
		activeId.value = null;
		shifts.value = {};
		dragY.value = 0;
		lift.value = 0;
	}, [activeId, dragY, lift, phase, shifts]);

	// The new order and the zeroed transforms land together. Laid out in the new order, a row's
	// transform of "from where it was to where it is" is already wrong, so it is cleared in the same
	// commit rather than a frame after it — which is the one-frame jump this effect exists to avoid.
	useLayoutEffect(() => {
		order.value = value.slice();
		pinnedValue.value = pinned;
		if (!isPending.current) return;
		isPending.current = false;
		scheduleOnUI(reset);
	}, [order, pinned, pinnedValue, reset, value]);

	// Re-reads the finger and the scroll into the row's translation and its target slot. Called by
	// the pan on every move and by auto-scroll on every frame it scrolls, so both paths agree.
	const retarget = useCallback(() => {
		"worklet";
		const ids = order.value;
		const start = startIndex.value;
		dragY.value = translation.value + scrollOffset.value - startScroll.value;
		const sizes = heights.value;
		const offsets = computeOffsets(ids, sizes, gap);
		const list: number[] = [];
		for (const id of ids) list.push(sizes[id] ?? 0);
		const next = resolveTargetIndex({
			activeHeight: list[start] ?? 0,
			activeIndex: start,
			activeTop: (offsets[start] ?? 0) + dragY.value,
			heights: list,
			offsets,
			pinned: pinnedValue.value,
		});
		if (next === targetIndex.value) return;
		targetIndex.value = next;
		shifts.value = resolveShifts(ids, reorderItems(ids, start, next, pinnedValue.value), sizes, gap);
		if (passHaptic !== false) playHaptic(passHaptic);
	}, [
		dragY,
		gap,
		heights,
		order,
		passHaptic,
		pinnedValue,
		scrollOffset,
		shifts,
		startIndex,
		startScroll,
		targetIndex,
		translation,
	]);

	const autoscrollFrame = useFrameCallback(() => {
		if (scrollRef === undefined || phase.value !== 1) return;
		const viewport = measure(scrollRef);
		const list = measure(rootRef);
		if (viewport === null || list === null) return;
		const raw = resolveAutoscrollStep(
			fingerY.value,
			viewport.pageY,
			viewport.height,
			autoscrollThreshold,
			autoscrollSpeed
		);
		const step = clampAutoscrollStep(
			raw,
			list.pageY,
			list.pageY + list.height,
			viewport.pageY,
			viewport.pageY + viewport.height
		);
		if (step === 0) return;
		const next = scrollOffset.value + step;
		scrollTo(scrollRef, 0, next, false);
		scrollOffset.value = next;
		retarget();
	}, false);

	const setAutoscroll = useCallback(
		(isActive: boolean) => {
			if (scrollRef !== undefined) autoscrollFrame.setActive(isActive);
		},
		[autoscrollFrame, scrollRef]
	);

	const notifyDragStart = useCallback(
		(id: string) => {
			setAutoscroll(true);
			callbacks.current.onDragStart?.(id);
		},
		[setAutoscroll]
	);

	const settle = useCallback(
		(id: string, from: number, to: number) => {
			setAutoscroll(false);
			callbacks.current.onDragEnd?.(id);
			if (from === to) {
				scheduleOnUI(reset);
				return;
			}
			const current = committed.current;
			const next = reorderItems(current.value, from, to, current.pinned);
			isPending.current = true;
			callbacks.current.onReorder(next, { from, id, to });
			setTimeout(() => {
				if (!isPending.current) return;
				isPending.current = false;
				scheduleOnUI(reset);
			}, UNCOMMITTED_RESET_DELAY);
		},
		[reset, setAutoscroll]
	);

	const drag = useMemo<SortableDrag>(
		() => ({
			begin: (id, absoluteY) => {
				"worklet";
				if (phase.value !== 0) return;
				const index = order.value.indexOf(id);
				if (index === -1 || pinnedValue.value[index] === true) return;
				phase.value = 1;
				activeId.value = id;
				startIndex.value = index;
				targetIndex.value = index;
				translation.value = 0;
				dragY.value = 0;
				startScroll.value = scrollOffset.value;
				fingerY.value = absoluteY;
				lift.value = withTiming(1, { duration: isReducedMotion ? 0 : SORTABLE_LIFT_DURATION });
				if (liftHaptic !== false) playHaptic(liftHaptic);
				scheduleOnRN(notifyDragStart, id);
			},
			update: (id, translationY, absoluteY) => {
				"worklet";
				if (phase.value !== 1 || activeId.value !== id) return;
				translation.value = translationY;
				fingerY.value = absoluteY;
				retarget();
			},
			end: (id) => {
				"worklet";
				if (phase.value !== 1 || activeId.value !== id) return;
				phase.value = 2;
				const from = startIndex.value;
				const to = targetIndex.value;
				const landing = from === to ? 0 : (shifts.value[id] ?? 0);
				const landed = () => {
					"worklet";
					scheduleOnRN(settle, id, from, to);
				};
				lift.value = withTiming(0, { duration: isReducedMotion ? 0 : SORTABLE_LIFT_DURATION });
				dragY.value = isReducedMotion
					? withTiming(landing, { duration: 0 }, landed)
					: withSpring(landing, SORTABLE_SHIFT_SPRING, landed);
			},
		}),
		[
			activeId,
			dragY,
			fingerY,
			isReducedMotion,
			lift,
			liftHaptic,
			notifyDragStart,
			order,
			phase,
			pinnedValue,
			retarget,
			scrollOffset,
			settle,
			shifts,
			startIndex,
			startScroll,
			targetIndex,
			translation,
		]
	);

	const setHeight = useCallback(
		(id: string, height: number) => {
			heights.modify((current) => {
				"worklet";
				current[id] = height;
				return current;
			});
		},
		[heights]
	);

	const move = useCallback(
		(id: string, direction: SortableMoveDirection) => {
			const action = resolveMoveAction(value, id, direction, pinned);
			if (action.kind === "blocked") return;
			onReorder(reorderItems(value, action.from, action.to, pinned), { from: action.from, id, to: action.to });
			AccessibilityInfo.announceForAccessibility(resolveSortablePosition(action.to, value.length));
		},
		[onReorder, pinned, value]
	);

	const context = useMemo<SortableContextValue>(
		() => ({
			activation,
			activeId,
			drag,
			dragY,
			isDisabled,
			isReducedMotion,
			lift,
			longPressDelay,
			move,
			order: value,
			phase,
			pinned,
			setHeight,
			shifts,
		}),
		[
			activation,
			activeId,
			drag,
			dragY,
			isDisabled,
			isReducedMotion,
			lift,
			longPressDelay,
			move,
			phase,
			pinned,
			setHeight,
			shifts,
			value,
		]
	);

	return (
		<SortableProvider value={context}>
			<Animated.View
				className={sortableVariants().root({ className })}
				ref={rootRef}
				style={[{ gap }, style]}
				{...props}
			>
				{children}
			</Animated.View>
		</SortableProvider>
	);
}

/**
 * Which rows are pinned, read from the rows' own props.
 *
 * Read during render, the way `Steps` counts its items, so the first render already knows which
 * Move up / Move down actions each row can offer — a registration effect would publish them a
 * frame late. A row behind a wrapper component is not found, and counts as unpinned.
 */
function collectPinned(children: ReactNode): Record<string, boolean> {
	const pinned: Record<string, boolean> = {};
	for (const child of Children.toArray(children)) {
		if (isValidElement<SortableItemProps>(child) && child.type === SortableItem) {
			pinned[child.props.id] = child.props.isPinned === true;
		}
	}
	return pinned;
}

/**
 * A vertical list the user reorders by dragging.
 *
 * **A drag renders nothing.** Rows keep their laid-out positions and move with transforms on the UI
 * thread: the lifted row follows the finger, and the rows it passes step aside on a spring. React
 * hears about the move once, through `onReorder`, after the row has landed — and the transforms are
 * cleared in the same commit that renders the new order, so nothing jumps.
 *
 * **The order is the caller's.** `value` is the row ids in render order; render the rows from it and
 * store what `onReorder` hands back. A row lands in the first slot whose midpoint it crosses.
 *
 * `activation="handle"` (the default) lifts from `Sortable.Handle`, leaving the rest of the row free
 * for taps and scrolls; `"long-press"` lifts the whole row after a hold. A pinned row never moves and
 * the others reorder around it; a disabled row cannot be lifted but the others move past it.
 *
 * Inside a scroll view, pass its animated ref as `scrollRef` and the list scrolls when the finger
 * nears either edge.
 *
 * Screen readers cannot drag, so the handle (or the row, in `long-press` mode) offers Move up and
 * Move down actions and announces the new position.
 *
 * Every row stays mounted — there is no virtualisation. It is comfortable to about a hundred rows.
 *
 * @example
 * const [order, setOrder] = useState(["a", "b", "c"]);
 *
 * <Sortable value={order} onReorder={setOrder} gap={8}>
 *   {order.map((id) => (
 *     <Sortable.Item key={id} id={id}>
 *       <Item variant="outline">
 *         <Item.Content>
 *           <Item.Title>{rows[id].title}</Item.Title>
 *         </Item.Content>
 *         <Sortable.Handle />
 *       </Item>
 *     </Sortable.Item>
 *   ))}
 * </Sortable>
 *
 * @example
 * const scrollRef = useAnimatedRef<Animated.ScrollView>();
 *
 * <Screen.ScrollArea ref={scrollRef}>
 *   <Sortable value={order} onReorder={setOrder} activation="long-press" scrollRef={scrollRef}>
 *     {rows}
 *   </Sortable>
 * </Screen.ScrollArea>
 */
export const Sortable = Object.assign(SortableRoot, {
	/** One row — the box that is measured, lifted and moved. Keyed by `id`. */
	Item: SortableItem,
	/** The grip a row is dragged by, and the row's Move up / Move down actions for a screen reader. */
	Handle: SortableHandle,
	displayName: "DelacourUI.Sortable",
});
