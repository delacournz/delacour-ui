import {
	isValidElement,
	type ReactElement,
	type ReactNode,
	type Ref,
	useCallback,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useReducedMotion, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";
import { type HapticFeedback, playHaptic } from "../pressable";
import { type StackCardContextValue, StackCardProvider } from "./stack-card.context";
import type { StackCardHandle } from "./stack-card.types";
import {
	partitionStackChildren,
	resolveDragOffset,
	resolveExitOffset,
	resolveMountedWindow,
	resolveStackDepth,
	resolveStackRelease,
	STACK_CARD_DEFAULT_DIRECTION_LABELS,
	STACK_CARD_DEFAULT_DIRECTIONS,
	STACK_CARD_DEFAULT_THRESHOLD,
	type StackCardChildKind,
	type StackCardDirection,
	type StackCardLayout,
	type StackCardStampColor,
	stackCardVariants,
} from "./stack-card.variants";
import { StackCardAction } from "./stack-card-action";
import { StackCardActions } from "./stack-card-actions";
import { StackCardCard } from "./stack-card-card";
import { StackCardEmpty } from "./stack-card-empty";
import { StackCardSlot } from "./stack-card-slot";
import { StackCardStamp, type StackCardStampProps } from "./stack-card-stamp";

export type StackCardProps = Omit<ViewProps, "children"> & {
	/** Stamps, cards in order, an `Empty` and an `Actions` row, in any order. */
	children: ReactNode;
	/** Give it a height: the pile takes whatever the actions row leaves. */
	className?: string;
	pileClassName?: string;
	/** Controlled top-card index. */
	index?: number;
	/** Starting top-card index while uncontrolled. Defaults to 0. */
	defaultIndex?: number;
	/**
	 * Called with the next index after a throw or an undo. A controlled deck that
	 * leaves `index` where it was **declines** the throw, and the card flies back.
	 */
	onIndexChange?: (index: number) => void;
	/** Called with the direction and the thrown card's index, before `onIndexChange`. */
	onSwipe?: (direction: StackCardDirection, index: number) => void;
	/** Called once, when the last card leaves. */
	onEmpty?: () => void;
	/** The directions a drag throws in. Defaults to left and right. */
	directions?: readonly StackCardDirection[];
	/** How the cards behind the top are drawn. Defaults to `stack`. */
	layout?: StackCardLayout;
	/** Cards drawn behind the top: 0..4, default 2. */
	depth?: number;
	/** Fraction of the card's width or height a drag must cover. Defaults to 0.3. */
	threshold?: number;
	isDisabled?: boolean;
	/**
	 * Ticks when a drag first crosses the threshold, and again each time it
	 * crosses back out and in; a throw knocks with `medium`. `false` silences
	 * both. Defaults to `selection`.
	 */
	haptic?: false | HapticFeedback;
	/** What a screen reader and an action button call each direction. */
	directionLabels?: Partial<Record<StackCardDirection, string>>;
	ref?: Ref<StackCardHandle>;
};

/** A throw or an undo the deck asked for, waiting to see whether the index moved. */
type StackCardPending =
	| { kind: "throw"; from: number; direction: StackCardDirection }
	| { kind: "undo"; from: number; direction: StackCardDirection };

/**
 * The spring a card returns to the pile on. Critically damped — damping is
 * `2·√(stiffness·mass)` ≈ 26.5, rounded up — because any overshoot carries the
 * card past rest to the other side, where the opposite stamp fades in: a card
 * undone from the left would flash the right-hand answer as it lands.
 */
const RETURN_SPRING = { damping: 27, mass: 0.8, stiffness: 220 } as const;

/** A reduced-motion fade, in milliseconds. */
const FADE_MS = 180;

/** Which part a child of the deck is — anything unrecognised is a card. */
function kindOf(node: ReactNode): StackCardChildKind {
	if (!isValidElement(node)) return "card";
	if (node.type === StackCardStamp) return "stamp";
	if (node.type === StackCardEmpty) return "empty";
	if (node.type === StackCardActions) return "actions";
	return "card";
}

function StackCardRoot({
	children,
	className,
	pileClassName,
	index: indexProp,
	defaultIndex = 0,
	onIndexChange,
	onSwipe,
	onEmpty,
	directions = STACK_CARD_DEFAULT_DIRECTIONS,
	layout = "stack",
	depth: depthProp,
	threshold = STACK_CARD_DEFAULT_THRESHOLD,
	isDisabled = false,
	haptic = "selection",
	directionLabels,
	ref,
	...props
}: StackCardProps): ReactElement {
	const { stamps, cards, empty, actions } = partitionStackChildren(children, kindOf);
	const count = cards.length;
	const depth = resolveStackDepth(depthProp);
	const isReducedMotion = useReducedMotion();

	const [index, setIndex] = useControllableState<number>({
		defaultValue: defaultIndex,
		onChange: onIndexChange,
		value: indexProp,
	});
	const [history, setHistory] = useState<StackCardDirection[]>([]);
	const [pending, setPending] = useState<StackCardPending | null>(null);

	const x = useSharedValue(0);
	const y = useSharedValue(0);
	const top = useSharedValue(index);
	const fade = useSharedValue(1);
	const width = useSharedValue(0);
	const height = useSharedValue(0);
	const isBusy = useSharedValue(false);
	const isArmed = useSharedValue(false);

	// The newest callbacks, for the JS functions a worklet calls back into. A
	// worklet captures what it closed over when it was built, so it reaches the
	// caller's handlers through this rather than through a stale closure.
	const latest = useRef({ onEmpty, onSwipe, setIndex });
	useLayoutEffect(() => {
		latest.current = { onEmpty, onSwipe, setIndex };
	});

	const advance = useCallback((direction: StackCardDirection, from: number) => {
		latest.current.onSwipe?.(direction, from);
		latest.current.setIndex(from + 1);
		setPending({ direction, from, kind: "throw" });
	}, []);

	// Throws the top card. Runs on the UI thread, from the pan's release or from
	// a JS call through `scheduleOnUI`. The top moves the frame the throw lands,
	// before React hears of it, so the card behind is already the top.
	const fling = useCallback(
		(direction: StackCardDirection, vx: number, vy: number) => {
			"worklet";
			if (isBusy.value) return;
			const from = top.value;
			if (from >= count) return;
			isBusy.value = true;
			isArmed.value = false;
			if (haptic !== false) playHaptic("medium");
			const land = () => {
				"worklet";
				top.value = from + 1;
				x.value = 0;
				y.value = 0;
				fade.value = 1;
				isBusy.value = false;
				scheduleOnRN(advance, direction, from);
			};
			if (isReducedMotion) {
				fade.value = withTiming(0, { duration: FADE_MS }, () => land());
				return;
			}
			const exit = resolveExitOffset({ direction, height: height.value, width: width.value });
			const isHorizontal = direction === "left" || direction === "right";
			const targetX = isHorizontal ? exit.x : x.value + vx * 0.1;
			const targetY = isHorizontal ? y.value + vy * 0.1 : exit.y;
			const speed = Math.max(1, Math.hypot(vx, vy));
			const distance = Math.hypot(targetX - x.value, targetY - y.value);
			const duration = Math.min(320, Math.max(160, (distance / speed) * 1000));
			x.value = withTiming(targetX, { duration });
			y.value = withTiming(targetY, { duration }, () => land());
		},
		[advance, count, fade, haptic, height, isArmed, isBusy, isReducedMotion, top, width, x, y]
	);

	// Brings the top card back to rest from wherever it is: a short drag
	// released, or a card arriving from `fromX`/`fromY`.
	const settle = useCallback(
		(fromX: number, fromY: number, fadeIn: boolean) => {
			"worklet";
			if (isReducedMotion) {
				x.value = 0;
				y.value = 0;
				if (fadeIn) {
					fade.value = 0;
					fade.value = withTiming(1, { duration: FADE_MS }, () => {
						isBusy.value = false;
					});
				} else {
					fade.value = 1;
					isBusy.value = false;
				}
				return;
			}
			fade.value = 1;
			x.value = fromX;
			y.value = fromY;
			x.value = withSpring(0, RETURN_SPRING);
			y.value = withSpring(0, RETURN_SPRING, () => {
				isBusy.value = false;
			});
		},
		[fade, isBusy, isReducedMotion, x, y]
	);

	const swipe = useCallback(
		(direction: StackCardDirection) => {
			scheduleOnUI(fling, direction, 0, 0);
		},
		[fling]
	);

	const canUndo = !isDisabled && pending === null && index > 0 && history.length > 0;

	const undo = useCallback(() => {
		const direction = history.at(-1);
		if (!canUndo || direction === undefined) return;
		const to = index - 1;
		setPending({ direction, from: index, kind: "undo" });
		setIndex(to);
		scheduleOnUI(() => {
			"worklet";
			isBusy.value = true;
			top.value = to;
			const exit = resolveExitOffset({ direction, height: height.value, width: width.value });
			settle(exit.x, exit.y, true);
		});
	}, [canUndo, height, history, index, isBusy, setIndex, settle, top, width]);

	useImperativeHandle(ref, () => ({ swipe, undo }), [swipe, undo]);

	// Settles a throw or an undo once React has the index the caller chose. A
	// controlled deck that left `index` where it was declined it: a thrown card
	// flies back in from where it left, and a refused undo snaps back. Any other
	// change to `index` came from outside, and the pile simply follows it.
	const syncedIndex = useRef(index);
	useEffect(() => {
		if (pending) {
			setPending(null);
			syncedIndex.current = index;
			if (pending.kind === "throw") {
				if (index !== pending.from) {
					setHistory((current) => [...current, pending.direction]);
					scheduleOnUI(() => {
						"worklet";
						top.value = index;
					});
					return;
				}
				const { direction, from } = pending;
				scheduleOnUI(() => {
					"worklet";
					isBusy.value = true;
					top.value = from;
					const exit = resolveExitOffset({ direction, height: height.value, width: width.value });
					settle(exit.x, exit.y, true);
				});
				return;
			}
			if (index !== pending.from) {
				setHistory((current) => current.slice(0, -1));
				return;
			}
			scheduleOnUI(() => {
				"worklet";
				top.value = index;
				x.value = 0;
				y.value = 0;
				fade.value = 1;
				isBusy.value = false;
			});
			return;
		}
		if (syncedIndex.current === index) return;
		syncedIndex.current = index;
		setHistory([]);
		scheduleOnUI(() => {
			"worklet";
			top.value = index;
			x.value = 0;
			y.value = 0;
			fade.value = 1;
			isBusy.value = false;
		});
	}, [fade, height, index, isBusy, pending, settle, top, width, x, y]);

	// `onEmpty` fires on the step that empties the deck, once — not on mount for
	// a deck that starts empty, and not again until it has been refilled.
	const previousIndex = useRef(index);
	useEffect(() => {
		const previous = previousIndex.current;
		previousIndex.current = index;
		if (count > 0 && previous < count && index >= count) latest.current.onEmpty?.();
	}, [count, index]);

	const isHorizontalOnly = directions.every((direction) => direction === "left" || direction === "right");
	const isVerticalOnly = directions.every((direction) => direction === "up" || direction === "down");
	const isGestureEnabled = !isDisabled && index < count;

	const gesture = useMemo(() => {
		const pan = Gesture.Pan().enabled(isGestureEnabled);
		// A horizontal deck lets a vertical drag fall through to the scroll view
		// around it. A deck that throws both ways claims both axes, so it cannot
		// sit inside a scroller.
		if (isHorizontalOnly) pan.activeOffsetX([-10, 10]).failOffsetY([-10, 10]);
		else if (isVerticalOnly) pan.activeOffsetY([-10, 10]).failOffsetX([-10, 10]);
		else pan.minDistance(10);

		return pan
			.onUpdate((event) => {
				"worklet";
				if (isBusy.value) return;
				const offset = resolveDragOffset({
					directions,
					translationX: event.translationX,
					translationY: event.translationY,
				});
				x.value = offset.x;
				y.value = offset.y;
				const isPast =
					resolveStackRelease({
						directions,
						height: height.value,
						threshold,
						vx: 0,
						vy: 0,
						width: width.value,
						x: offset.x,
						y: offset.y,
					}) !== null;
				if (isPast && !isArmed.value) {
					isArmed.value = true;
					if (haptic !== false) playHaptic(haptic);
				} else if (!isPast && isArmed.value) {
					isArmed.value = false;
				}
			})
			.onEnd((event) => {
				"worklet";
				if (isBusy.value) return;
				isArmed.value = false;
				const direction = resolveStackRelease({
					directions,
					height: height.value,
					threshold,
					vx: event.velocityX,
					vy: event.velocityY,
					width: width.value,
					x: x.value,
					y: y.value,
				});
				if (direction !== null) {
					fling(direction, event.velocityX, event.velocityY);
					return;
				}
				settle(x.value, y.value, false);
			})
			.onFinalize(() => {
				"worklet";
				if (isBusy.value || (x.value === 0 && y.value === 0)) return;
				settle(x.value, y.value, false);
			});
	}, [
		directions,
		fling,
		haptic,
		height,
		isArmed,
		isBusy,
		isGestureEnabled,
		isHorizontalOnly,
		isVerticalOnly,
		settle,
		threshold,
		width,
		x,
		y,
	]);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			width.value = event.nativeEvent.layout.width;
			height.value = event.nativeEvent.layout.height;
		},
		[height, width]
	);

	const stampColors = useMemo(() => {
		const colors: Partial<Record<StackCardDirection, StackCardStampColor>> = {};
		for (const stamp of stamps) {
			if (!isValidElement<StackCardStampProps>(stamp)) continue;
			colors[stamp.props.direction ?? "right"] ??= stamp.props.color ?? "primary";
		}
		return colors;
	}, [stamps]);

	const labelFor = useCallback(
		(direction: StackCardDirection) => directionLabels?.[direction] ?? STACK_CARD_DEFAULT_DIRECTION_LABELS[direction],
		[directionLabels]
	);

	const context = useMemo<StackCardContextValue>(
		() => ({
			canUndo,
			count,
			depth,
			directions,
			fade,
			height,
			index,
			isDisabled,
			isReducedMotion,
			labelFor,
			layout,
			stampColors,
			swipe,
			threshold,
			top,
			undo,
			width,
			x,
			y,
		}),
		[
			canUndo,
			count,
			depth,
			directions,
			fade,
			height,
			index,
			isDisabled,
			isReducedMotion,
			labelFor,
			layout,
			stampColors,
			swipe,
			threshold,
			top,
			undo,
			width,
			x,
			y,
		]
	);

	const [from, to] = resolveMountedWindow({ count, depth, index });
	const inset = layout === "stack" ? depth * 8 : 0;
	const slots: ReactElement[] = [];
	// Deepest first, so the top card draws over the ones behind it — and the
	// card just thrown, kept for undo, draws over everything when it flies back.
	for (let cardIndex = to - 1; cardIndex >= from; cardIndex--) {
		const card = cards[cardIndex];
		const key = isValidElement(card) && card.key !== null ? card.key : cardIndex;
		const isTop = cardIndex === index;
		slots.push(
			<StackCardSlot cardIndex={cardIndex} inset={inset} isTop={isTop} key={key}>
				{card}
				{isTop ? stamps : null}
			</StackCardSlot>
		);
	}

	const variants = stackCardVariants();

	return (
		<StackCardProvider value={context}>
			<View className={variants.root({ className })} {...props}>
				<GestureDetector gesture={gesture}>
					<Animated.View className={cn(variants.pile(), pileClassName)} onLayout={handleLayout}>
						{index >= count ? empty : null}
						{slots}
					</Animated.View>
				</GestureDetector>
				{actions}
			</View>
		</StackCardProvider>
	);
}

/**
 * A pile of cards taken one at a time by throwing the top one off.
 *
 * For a queue where each item gets one decision and is then gone — a review
 * queue, flashcards, suggestions. The gesture is the answer: drag past the
 * threshold, or flick, and the card leaves; a short drag springs back. A
 * direction the deck does not allow gives a little and returns. It shows one
 * card, so it is wrong for anything the reader must compare or skim.
 *
 * One shared value — the top card's offset — drives every part: the stamps fade
 * in toward their direction and the cards behind step up as it moves, so the
 * next card is in place before the top one leaves, and nothing re-renders
 * during a drag. Only a window around the top is mounted, so a deck of 500
 * costs what a deck of five does.
 *
 * Controlled with `index` and `onIndexChange`, or uncontrolled from
 * `defaultIndex`. A controlled deck declines a throw by leaving `index` where it
 * was, and the card flies back. A `ref` or `useStackCard()` throws and undoes
 * from code.
 *
 * A deck that throws only left and right lets a vertical drag through to a
 * scroll view around it. One that throws all four ways claims both axes, so do
 * not nest it in a scroller.
 *
 * @example
 * <StackCard className="h-[460px]" onSwipe={(dir, i) => decide(people[i], dir)}>
 *   <StackCard.Stamp direction="right" color="success">Yes</StackCard.Stamp>
 *   <StackCard.Stamp direction="left" color="destructive">No</StackCard.Stamp>
 *   {people.map((p) => <StackCard.Card key={p.id}>…</StackCard.Card>)}
 *   <StackCard.Empty>All caught up</StackCard.Empty>
 *   <StackCard.Actions>
 *     <StackCard.Action action="left" icon={IconCrossSmall} label="Skip" />
 *     <StackCard.Action action="undo" icon={IconArrowRotateCounterClockwise} />
 *     <StackCard.Action action="right" icon={IconCheckmark2} label="Save" />
 *   </StackCard.Actions>
 * </StackCard>
 */
export const StackCard = Object.assign(StackCardRoot, {
	/** One card in the deck. Its order among the children is its place in the pile. */
	Card: StackCardCard,
	/** The answer a throw in one direction gives, printed on the top card as it moves. */
	Stamp: StackCardStamp,
	/** Shown, centred in the pile, once every card has gone. */
	Empty: StackCardEmpty,
	/** A centred row of action buttons under the pile. */
	Actions: StackCardActions,
	/** A round button that throws the top card one way, or undoes the last throw. */
	Action: StackCardAction,
	displayName: "DelacourUI.StackCard",
});
