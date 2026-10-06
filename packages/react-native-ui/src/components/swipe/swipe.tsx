import {
	Children,
	type ReactElement,
	type ReactNode,
	type Ref,
	useCallback,
	useEffect,
	useId,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { type AccessibilityActionEvent, I18nManager, type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { type HapticFeedback, playHaptic } from "../pressable/pressable";
import { type SwipeContextValue, SwipeProvider, useSwipeGroupContext } from "./swipe.context";
import {
	partitionSwipeChildren,
	resolveOutermostIndex,
	SWIPE_FLY_OFF_DURATION,
	SWIPE_FULL_FRACTION,
	SWIPE_PROJECTION,
	SWIPE_REDUCED_DURATION,
	SWIPE_RUBBER_BAND,
	SWIPE_SPRING,
	SWIPE_TILE_WIDTH,
	type SwipeOpenSide,
	type SwipeSide,
	swipeVariants,
} from "./swipe.variants";
import { SwipeAction } from "./swipe-action";
import { SwipeEnd } from "./swipe-end";
import { SwipeGroup } from "./swipe-group";
import { SwipePanelLayer } from "./swipe-panel";
import { SwipeStart } from "./swipe-start";

export type SwipeHandle = {
	/** Slides the row aside to reveal `side`. A side with no tiles stays shut. */
	open: (side: SwipeSide) => void;
	close: () => void;
};

export type SwipeProps = Omit<ViewProps, "children"> & {
	/** `Swipe.Start`, `Swipe.End` and the row — anything that is not a panel. Order does not matter. */
	children: ReactNode;
	className?: string;
	/** The moving row. */
	contentClassName?: string;
	/** A drag far past the panel fires the outermost action. Default `true`. */
	isFullSwipe?: boolean;
	/** Turns the gesture off. Tiles already open stay tappable. */
	isDisabled?: boolean;
	/** Ticks once as a drag crosses the full-swipe point. Off by default. */
	haptic?: false | HapticFeedback;
	/** The side that settled open, or `null` once the row is shut. */
	onOpenChange?: (side: SwipeOpenSide) => void;
	ref?: Ref<SwipeHandle>;
};

/**
 * Read once: a direction change needs an app reload in React Native, so there
 * is no live value to follow.
 */
const IS_RTL = I18nManager.isRTL;

function SwipeRoot({
	children,
	className,
	contentClassName,
	isFullSwipe = true,
	isDisabled = false,
	haptic = false,
	onOpenChange,
	onLayout,
	accessibilityLabel,
	accessibilityHint,
	ref,
	...props
}: SwipeProps): ReactElement {
	const { start, end, row } = useMemo(() => partitionSwipeChildren(Children.toArray(children)), [children]);
	const startWidth = start.length * SWIPE_TILE_WIDTH;
	const endWidth = end.length * SWIPE_TILE_WIDTH;
	const isReducedMotion = useReducedMotion();

	// Logical points: positive reveals `start`. The row's translation flips it
	// under right to left; nothing else has to.
	const offset = useSharedValue(0);
	const grabbed = useSharedValue(0);
	const rowWidth = useSharedValue(0);
	const rowOpacity = useSharedValue(1);
	const isActive = useSharedValue(false);
	const isPastFull = useSharedValue(false);

	const [openSide, setOpenSide] = useState<SwipeOpenSide>(null);
	const openSideRef = useRef<SwipeOpenSide>(null);
	const group = useSwipeGroupContext();
	const id = useId();

	const onOpenChangeRef = useRef(onOpenChange);
	onOpenChangeRef.current = onOpenChange;

	const settle = useCallback(
		(side: SwipeOpenSide) => {
			if (openSideRef.current === side) return;
			openSideRef.current = side;
			setOpenSide(side);
			onOpenChangeRef.current?.(side);
			if (side !== null) group?.notifyOpen(id);
		},
		[group, id]
	);

	const animateTo = useCallback(
		(target: number) => {
			offset.value = isReducedMotion
				? withTiming(target, { duration: SWIPE_REDUCED_DURATION })
				: withSpring(target, SWIPE_SPRING);
		},
		[isReducedMotion, offset]
	);

	const close = useCallback(() => {
		animateTo(0);
		settle(null);
	}, [animateTo, settle]);

	const open = useCallback(
		(side: SwipeSide) => {
			const width = side === "start" ? startWidth : endWidth;
			if (width <= 0) return;
			animateTo(side === "start" ? width : -width);
			settle(side);
		},
		[animateTo, endWidth, settle, startWidth]
	);

	useImperativeHandle(ref, () => ({ close, open }), [close, open]);

	// A group closes the others through this, so a row already shut is left
	// alone — a drag under way on it is not the group's to cancel.
	const closeFromGroup = useCallback(() => {
		if (openSideRef.current !== null) close();
	}, [close]);

	useEffect(() => group?.register(id, closeFromGroup), [closeFromGroup, group, id]);

	const runAction = useCallback(
		(onPress: () => void, isKeptOpen: boolean) => {
			onPress();
			if (!isKeptOpen) close();
		},
		[close]
	);

	const tilesRef = useRef({ end, start });
	tilesRef.current = { end, start };

	// Runs once the fly-off has carried the row away. The way back is delayed a
	// beat so an action that removes the row unmounts it before it slides in.
	const completeFullSwipe = useCallback(
		(side: SwipeSide) => {
			const tiles = tilesRef.current[side];
			const outermost = tiles[resolveOutermostIndex(side, tiles.length)];
			outermost?.props.onPress?.();

			openSideRef.current = null;
			setOpenSide(null);
			onOpenChangeRef.current?.(null);

			if (isReducedMotion) {
				offset.value = 0;
				rowOpacity.value = withDelay(SWIPE_REDUCED_DURATION, withTiming(1, { duration: SWIPE_REDUCED_DURATION }));
			} else {
				offset.value = withDelay(SWIPE_FLY_OFF_DURATION, withSpring(0, SWIPE_SPRING));
			}
		},
		[isReducedMotion, offset, rowOpacity]
	);

	const pan = useMemo(
		() =>
			Gesture.Pan()
				.enabled(!isDisabled)
				.activeOffsetX([-10, 10])
				.failOffsetY([-8, 8])
				.onStart(() => {
					"worklet";
					isActive.value = true;
					grabbed.value = offset.value;
					isPastFull.value = false;
				})
				.onUpdate((event) => {
					"worklet";
					const raw = grabbed.value + (IS_RTL ? -event.translationX : event.translationX);
					const isUnbacked = (raw > 0 && startWidth <= 0) || (raw < 0 && endWidth <= 0);
					const next = isUnbacked ? raw * SWIPE_RUBBER_BAND : raw;
					offset.value = next;

					if (!isFullSwipe || haptic === false || rowWidth.value <= 0) return;
					const width = next > 0 ? startWidth : endWidth;
					const isPast = width > 0 && Math.abs(next) > width + SWIPE_FULL_FRACTION * rowWidth.value;
					if (isPast === isPastFull.value) return;
					isPastFull.value = isPast;
					if (isPast) playHaptic(haptic);
				})
				.onFinalize((event) => {
					"worklet";
					if (!isActive.value) return;
					isActive.value = false;

					// `resolveSwipeRelease`, restated: a worklet body stays self-contained.
					const current = offset.value;
					const velocity = IS_RTL ? -event.velocityX : event.velocityX;
					const projected = current + velocity * SWIPE_PROJECTION;
					const isCrossing = current !== 0 && Math.sign(projected) !== Math.sign(current);
					const side: SwipeSide = projected > 0 ? "start" : "end";
					const width = side === "start" ? startWidth : endWidth;
					const fullAt = width + SWIPE_FULL_FRACTION * rowWidth.value;
					const isClosing = projected === 0 || isCrossing || width <= 0;
					const isFull =
						!isClosing &&
						isFullSwipe &&
						rowWidth.value > 0 &&
						Math.abs(current) > fullAt &&
						Math.abs(projected) > fullAt;
					const isOpening = !isClosing && !isFull && Math.abs(projected) > width / 2;
					const direction = side === "start" ? 1 : -1;

					if (isFull) {
						if (isReducedMotion) {
							rowOpacity.value = withTiming(0, { duration: SWIPE_REDUCED_DURATION }, (finished) => {
								if (finished) scheduleOnRN(completeFullSwipe, side);
							});
						} else {
							offset.value = withTiming(
								direction * rowWidth.value,
								{ duration: SWIPE_FLY_OFF_DURATION },
								(finished) => {
									if (finished) scheduleOnRN(completeFullSwipe, side);
								}
							);
						}
						return;
					}

					const target = isOpening ? direction * width : 0;
					offset.value = isReducedMotion
						? withTiming(target, { duration: SWIPE_REDUCED_DURATION })
						: withSpring(target, { ...SWIPE_SPRING, velocity });
					scheduleOnRN(settle, isOpening ? side : null);
				}),
		[
			completeFullSwipe,
			endWidth,
			grabbed,
			haptic,
			isActive,
			isDisabled,
			isFullSwipe,
			isPastFull,
			isReducedMotion,
			offset,
			rowOpacity,
			rowWidth,
			settle,
			startWidth,
		]
	);

	const shieldTap = useMemo(
		() =>
			Gesture.Tap().onEnd(() => {
				"worklet";
				scheduleOnRN(close);
			}),
		[close]
	);

	const rowStyle = useAnimatedStyle(() => ({
		opacity: rowOpacity.value,
		transform: [{ translateX: IS_RTL ? -offset.value : offset.value }],
	}));

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			rowWidth.value = event.nativeEvent.layout.width;
			onLayout?.(event);
		},
		[onLayout, rowWidth]
	);

	const actions = useMemo(() => [...start, ...end].map((tile) => tile.props), [end, start]);
	const accessibilityActions = useMemo(
		() =>
			actions.flatMap((action) => (action.label === undefined ? [] : [{ label: action.label, name: action.label }])),
		[actions]
	);
	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			const action = actions.find((entry) => entry.label === event.nativeEvent.actionName);
			action?.onPress?.();
		},
		[actions]
	);

	const context = useMemo<SwipeContextValue>(
		() => ({ close, isRTL: IS_RTL, offset, open, openSide, runAction }),
		[close, offset, open, openSide, runAction]
	);

	const slots = swipeVariants();
	const isShut = openSide === null;

	return (
		<SwipeProvider value={context}>
			<View className={slots.root({ className })} onLayout={handleLayout} {...props}>
				{start.length > 0 ? <SwipePanelLayer isHidden={isShut} side="start" tiles={start} /> : null}
				{end.length > 0 ? <SwipePanelLayer isHidden={isShut} side="end" tiles={end} /> : null}
				<GestureDetector gesture={pan}>
					<Animated.View
						accessibilityActions={accessibilityActions}
						accessibilityHint={accessibilityHint}
						accessibilityLabel={accessibilityLabel}
						accessible
						className={slots.row({ className: contentClassName })}
						onAccessibilityAction={handleAccessibilityAction}
						style={rowStyle}
					>
						{row}
						{isShut ? null : (
							<GestureDetector gesture={shieldTap}>
								<View accessible={false} className="absolute inset-0" />
							</GestureDetector>
						)}
					</Animated.View>
				</GestureDetector>
			</View>
		</SwipeProvider>
	);
}

/**
 * A row that slides aside to reveal actions behind it — delete, archive,
 * snooze, mark done.
 *
 * The tiles sit **behind** the row rather than beside it, so nothing reflows
 * when one opens, and only the row moves, on the UI thread. A drag that is
 * clearly sideways claims the touch and one that commits vertically gives it
 * up, so a list of rows scrolls normally. A release opens a side or closes the
 * row by where it would come to rest; a drag far past the panel fires the
 * outermost action (`isFullSwipe`, on by default).
 *
 * `Swipe.Start` and `Swipe.End` are markers: their `Swipe.Action`s are lifted
 * out and laid out by the root. Everything else is the row. Every action is
 * also published as an accessibility action on the row, since a swipe is
 * invisible to a screen reader.
 *
 * Wrap rows in `Swipe.Group` to keep one open at a time; `useSwipeGroup()`
 * closes them all. A ref exposes `open(side)` and `close()`.
 *
 * @example
 * <Swipe haptic="selection">
 *   <Swipe.Start>
 *     <Swipe.Action color="success" icon={IconCheckmark2} label="Done" onPress={complete} />
 *   </Swipe.Start>
 *   <Swipe.End>
 *     <Swipe.Action color="warning" icon={IconBell} label="Snooze" onPress={snooze} />
 *     <Swipe.Action color="destructive" icon={IconTrashCan} label="Delete" onPress={remove} />
 *   </Swipe.End>
 *   <Item>…</Item>
 * </Swipe>
 */
export const Swipe = Object.assign(SwipeRoot, {
	/** Tiles behind the start edge. A marker: its children are lifted out. */
	Start: SwipeStart,
	/** Tiles behind the end edge — the edge text runs toward. A marker. */
	End: SwipeEnd,
	/** One tile: a glyph above a caption, on its colour. */
	Action: SwipeAction,
	/** Keeps one row open at a time, however deeply its rows are nested. */
	Group: SwipeGroup,
	displayName: "DelacourUI.Swipe",
});
