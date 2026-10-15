import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
	type Ref,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { AccessibilityInfo, type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	cancelAnimation,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { useControllableState } from "../../hooks/use-controllable-state";
import { type HapticFeedback, playHaptic } from "../pressable";
import { type FlipCardContextValue, FlipCardProvider } from "./flip-card.context";
import {
	FLIP_CARD_CALM_DURATION,
	FLIP_CARD_DEFAULT_FACE_LABELS,
	FLIP_CARD_DEFAULT_PERSPECTIVE,
	FLIP_CARD_MOTION,
	FLIP_CARD_PRESS_SPRING,
	FLIP_CARD_PRESSED_SCALE,
	type FlipCardAxis,
	type FlipCardFace,
	type FlipCardMotion,
	type FlipCardTrigger,
	faceRotation,
	flipCardVariants,
	isFlipCardFaceName,
	oppositeFace,
	resolveFlipCardActions,
	resolveFlipTarget,
	resolveRubberBand,
	resolveSwipeVelocity,
	rotationFromDrag,
	shouldTickFlipHaptic,
} from "./flip-card.variants";
import { FlipCardBack } from "./flip-card-back";
import { FlipCardFront } from "./flip-card-front";
import { FlipCardTriggerButton } from "./flip-card-trigger";

/** What a ref on a `FlipCard` can do. */
export type FlipCardHandle = {
	/** Turns to the other face. */
	flip: () => void;
	/** Turns to a named face; a no-op if it is already showing. */
	flipTo: (face: FlipCardFace) => void;
};

type FlipCardBaseProps = Omit<ViewProps, "children" | "accessibilityLabel"> & {
	/** Controlled face. Omit for uncontrolled. */
	face?: FlipCardFace;
	/** The face an uncontrolled card starts on. Default `"front"`. */
	defaultFace?: FlipCardFace;
	/** Fires when a turn is committed — at its start, not when it settles. */
	onFaceChange?: (face: FlipCardFace) => void;
	/** Fires once the card has settled on a face. */
	onFlipEnd?: (face: FlipCardFace) => void;
	/** The axis the card turns about. Default `"y"`. */
	axis?: FlipCardAxis;
	/** Camera distance in points, applied before the rotation. Default 1000. */
	perspective?: number;
	/** The spring the turn settles on. Default `"default"`. */
	motion?: FlipCardMotion;
	/** Played as the card passes edge-on. Default `"light"`; `false` silences it. */
	haptic?: false | HapticFeedback;
	/** Blocks the gesture and every `FlipCard.Trigger`. A ref or a controlled `face` still turns it. */
	isDisabled?: boolean;
	/** Spoken after the card settles. Default "Front of card" / "Back of card". */
	faceLabels?: Record<FlipCardFace, string>;
	/** Names the card as a whole. */
	accessibilityLabel?: string;
	/** The card's footprint — `h-48`, `aspect-[1.586]`. The front is in flow; the back fills it. */
	className?: string;
	/** `FlipCard.Front`, `FlipCard.Back`, and anything else — which renders beneath the card. */
	children: ReactNode;
	ref?: Ref<FlipCardHandle>;
};

export type FlipCardProps =
	| (FlipCardBaseProps & {
			/** Tap anywhere on the card to turn it. The default. */
			trigger?: "press";
	  })
	| (FlipCardBaseProps & {
			/** A drag scrubs the turn and settles on the nearer face. */
			trigger: "swipe";
			/** Drag travel, in points, that equals a half turn. Default: the card's extent along the drag. */
			swipeDistance?: number;
	  })
	| (FlipCardBaseProps & {
			/** No gesture: only `face`, a ref or a `FlipCard.Trigger` turns it. */
			trigger: "manual";
	  });

/** Every prop a card can carry, flattened — the union narrowed once, at the top of the root. */
type FlipCardResolvedProps = FlipCardBaseProps & { trigger?: FlipCardTrigger; swipeDistance?: number };

/** Whether a child is `FlipCard.Front` or `FlipCard.Back` — by reference, else by `displayName`. */
function isFlipCardFaceElement(child: ReactNode): boolean {
	if (!isValidElement(child)) return false;
	if (child.type === FlipCardFront || child.type === FlipCardBack) return true;
	const type = child.type as { displayName?: string } | null;
	return isFlipCardFaceName(type?.displayName);
}

/**
 * Splits the root's children into the faces, which stack inside the card, and
 * everything else, which renders beneath it — so a `FlipCard.Trigger` written
 * beside the faces is not covered by the back.
 */
function splitFlipCardChildren(children: ReactNode): { faces: ReactNode[]; rest: ReactNode[] } {
	const faces: ReactNode[] = [];
	const rest: ReactNode[] = [];
	Children.forEach(children, (child) => {
		if (isFlipCardFaceElement(child)) {
			faces.push(child);
		} else if (child !== null && child !== undefined && typeof child !== "boolean") {
			rest.push(child);
		}
	});
	return { faces, rest };
}

function FlipCardRoot(props: FlipCardProps): ReactElement {
	const {
		face: faceProp,
		defaultFace = "front",
		onFaceChange,
		onFlipEnd,
		axis = "y",
		perspective = FLIP_CARD_DEFAULT_PERSPECTIVE,
		motion = "default",
		haptic = "light",
		isDisabled = false,
		faceLabels = FLIP_CARD_DEFAULT_FACE_LABELS,
		accessibilityLabel,
		className,
		children,
		ref,
		trigger = "press",
		swipeDistance,
		...viewProps
	}: FlipCardResolvedProps = props;

	const isCalm = useCalmMotion();

	// Ref-backed, so a caller passing a fresh arrow every render does not change
	// the identity of every callback below.
	const callbacks = useRef({ faceLabels, onFaceChange, onFlipEnd });
	callbacks.current = { faceLabels, onFaceChange, onFlipEnd };
	const handleFaceChange = useCallback((next: FlipCardFace) => callbacks.current.onFaceChange?.(next), []);

	const [face, setFace] = useControllableState<FlipCardFace>({
		defaultValue: defaultFace,
		onChange: handleFaceChange,
		value: faceProp,
	});
	const faceRef = useRef(face);
	faceRef.current = face;

	const [isFlipping, setFlipping] = useState(false);

	// Seeded from the face, so a card mounted on its back does not turn over on
	// its first paint.
	const rotation = useSharedValue<number>(faceRotation(face));
	const pressed = useSharedValue(0);
	const dragStart = useSharedValue(0);
	const dragFrom = useSharedValue<0 | 180>(0);
	// The side the crossing haptic last played on, as 0 or 180 — see `shouldTickFlipHaptic`.
	const hapticSide = useSharedValue<number>(faceRotation(face));
	const width = useSharedValue(0);
	const height = useSharedValue(0);

	const lastSettled = useRef<FlipCardFace>(face);
	const handleSettled = useCallback((target: 0 | 180) => {
		const settled: FlipCardFace = target === 0 ? "front" : "back";
		setFlipping(false);
		callbacks.current.onFlipEnd?.(settled);
		if (settled !== lastSettled.current) {
			lastSettled.current = settled;
			AccessibilityInfo.announceForAccessibility(callbacks.current.faceLabels[settled]);
		}
	}, []);

	const spring = FLIP_CARD_MOTION[motion];
	const animateTo = useCallback(
		(target: 0 | 180, velocity = 0) => {
			setFlipping(true);
			const settle = (finished?: boolean) => {
				"worklet";
				if (finished) scheduleOnRN(handleSettled, target);
			};
			rotation.value = isCalm
				? withTiming(target, { duration: FLIP_CARD_CALM_DURATION }, settle)
				: withSpring(target, { damping: spring.damping, stiffness: spring.stiffness, velocity }, settle);
		},
		[handleSettled, isCalm, rotation, spring.damping, spring.stiffness]
	);

	// The rotation a commit has already started toward, so the sync effect below
	// does not restart a spring that is under way — and does restart one when a
	// controlled parent refused the face it was heading for.
	const pending = useRef<number | null>(null);
	// Bumped on every commit, purely to re-run the sync effect: a refused commit
	// leaves `face` unchanged, and without a token that moves there is nothing to
	// re-run on and the card stays where the turn left it.
	const [commits, setCommits] = useState(0);

	const commitTo = useCallback(
		(target: 0 | 180, velocity = 0) => {
			animateTo(target, velocity);
			pending.current = target;
			setCommits((count) => count + 1);
			const next: FlipCardFace = target === 0 ? "front" : "back";
			if (next !== faceRef.current) setFace(next);
		},
		[animateTo, setFace]
	);

	const isMounted = useRef(false);
	// `commits` is the re-run trigger described above, not a value read here.
	// biome-ignore lint/correctness/useExhaustiveDependencies: the extra dependency is the re-run trigger
	useEffect(() => {
		if (!isMounted.current) {
			isMounted.current = true;
			return;
		}
		const target = faceRotation(face);
		const started = pending.current;
		pending.current = null;
		if (started === target) return;
		animateTo(target);
	}, [face, commits, animateTo]);

	useEffect(() => () => cancelAnimation(rotation), [rotation]);

	const flipTo = useCallback(
		(next: FlipCardFace) => {
			if (next === faceRef.current) return;
			commitTo(faceRotation(next));
		},
		[commitTo]
	);
	const flip = useCallback(() => flipTo(oppositeFace(faceRef.current)), [flipTo]);

	useImperativeHandle(ref, () => ({ flip, flipTo }), [flip, flipTo]);

	useAnimatedReaction(
		() => rotation.value,
		(next) => {
			if (!shouldTickFlipHaptic(hapticSide.value, next)) return;
			hapticSide.value = next >= 90 ? 180 : 0;
			if (haptic) playHaptic(haptic);
		},
		[haptic]
	);

	const isY = axis === "y";
	const gesture = useMemo(() => {
		if (trigger === "press") {
			return Gesture.Tap()
				.enabled(!isDisabled)
				.shouldCancelWhenOutside(true)
				.onBegin(() => {
					"worklet";
					pressed.value = withSpring(1, FLIP_CARD_PRESS_SPRING);
				})
				.onEnd(() => {
					"worklet";
					scheduleOnRN(flip);
				})
				.onFinalize(() => {
					"worklet";
					pressed.value = withSpring(0, FLIP_CARD_PRESS_SPRING);
				});
		}

		const pan = Gesture.Pan().enabled(trigger === "swipe" && !isDisabled);
		// Activates only along the drag axis and fails across it, so a vertical
		// scroll that starts on a left/right card still scrolls.
		const oriented = isY
			? pan.activeOffsetX([-10, 10]).failOffsetY([-14, 14])
			: pan.activeOffsetY([-10, 10]).failOffsetX([-14, 14]);

		return oriented
			.onStart(() => {
				"worklet";
				cancelAnimation(rotation);
				dragStart.value = rotation.value;
				dragFrom.value = rotation.value < 90 ? 0 : 180;
			})
			.onUpdate((event) => {
				"worklet";
				// Under calm motion nothing scrubs: a turn that followed the finger
				// would be the very motion the setting asked to remove.
				if (isCalm) return;
				const distance = swipeDistance ?? (isY ? width.value : height.value);
				const delta = isY ? event.translationX : -event.translationY;
				rotation.value = resolveRubberBand(rotationFromDrag(dragStart.value, delta, distance));
			})
			.onEnd((event) => {
				"worklet";
				const distance = swipeDistance ?? (isY ? width.value : height.value);
				const delta = isY ? event.translationX : -event.translationY;
				const velocity = resolveSwipeVelocity(isY ? event.velocityX : -event.velocityY, distance);
				const reached = isCalm ? rotationFromDrag(dragStart.value, delta, distance) : rotation.value;
				scheduleOnRN(commitTo, resolveFlipTarget(reached, velocity, dragFrom.value), velocity);
			});
	}, [
		commitTo,
		dragFrom,
		dragStart,
		flip,
		height,
		isCalm,
		isDisabled,
		isY,
		pressed,
		rotation,
		swipeDistance,
		trigger,
		width,
	]);

	const pressStyle = useAnimatedStyle(() => ({
		transform: [{ scale: 1 - pressed.value * (1 - FLIP_CARD_PRESSED_SCALE) }],
	}));

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			width.value = event.nativeEvent.layout.width;
			height.value = event.nativeEvent.layout.height;
		},
		[height, width]
	);

	const handleAccessibilityAction = useCallback(
		(event: { nativeEvent: { actionName: string } }) => {
			if (event.nativeEvent.actionName === "activate" && !isDisabled) flip();
		},
		[flip, isDisabled]
	);

	const context = useMemo<FlipCardContextValue>(
		() => ({
			accessibilityLabel,
			axis,
			face,
			flip,
			flipTo,
			isCalm,
			isDisabled,
			isFlipping,
			perspective,
			rotation,
			trigger,
		}),
		[accessibilityLabel, axis, face, flip, flipTo, isCalm, isDisabled, isFlipping, perspective, rotation, trigger]
	);

	const { faces, rest } = splitFlipCardChildren(children);
	const slots = flipCardVariants();
	const actions = isDisabled ? [] : resolveFlipCardActions(trigger);

	// The card is a container (`accessible={false}`) so the controls on its faces
	// stay reachable one by one. The swipe card's action lives on its visible face
	// instead — see `FlipCardFaceBody`.
	const card = (
		<Animated.View
			accessibilityActions={actions}
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{ disabled: isDisabled }}
			accessible={false}
			className={slots.root({ className })}
			onAccessibilityAction={handleAccessibilityAction}
			onLayout={handleLayout}
			style={pressStyle}
			{...viewProps}
		>
			{faces}
		</Animated.View>
	);

	return (
		<FlipCardProvider value={context}>
			{rest.length === 0 ? (
				<GestureDetector gesture={gesture}>{card}</GestureDetector>
			) : (
				<View className={slots.container()}>
					<GestureDetector gesture={gesture}>{card}</GestureDetector>
					{rest}
				</View>
			)}
		</FlipCardProvider>
	);
}

/**
 * Two faces of one card and a turn between them — a flashcard, a payment card
 * with its number on the back, a profile with details behind it.
 *
 * The face is state, and the rotation is derived from it: the face the card is
 * turning away from is hidden from assistive technology and stops taking
 * touches the moment a turn is committed. Which face is *drawn* is decided by
 * the angle, never by `backfaceVisibility`, so Android shows no flash of both.
 *
 * `trigger` picks the hand: `"press"` (a tap anywhere), `"swipe"` (a drag that
 * scrubs the turn and settles on the nearer face) or `"manual"` (only `face`, a
 * ref or a `FlipCard.Trigger`). Under reduce motion, or an app's
 * `isMotionCalm`, nothing turns and the faces crossfade.
 *
 * @example
 * <FlipCard className="h-48">
 *   <FlipCard.Front>
 *     <Text.Title>Bonjour</Text.Title>
 *   </FlipCard.Front>
 *   <FlipCard.Back>
 *     <Text.Title>Hello</Text.Title>
 *   </FlipCard.Back>
 * </FlipCard>
 *
 * @example
 * <FlipCard trigger="swipe" className="aspect-[1.586]">
 *   <FlipCard.Front>…</FlipCard.Front>
 *   <FlipCard.Back>…</FlipCard.Back>
 *   <FlipCard.Trigger>
 *     <Text.Label>Flip</Text.Label>
 *   </FlipCard.Trigger>
 * </FlipCard>
 */
export const FlipCard = Object.assign(FlipCardRoot, {
	/** The face the card starts on. In flow — its content sizes the card when `className` does not. */
	Front: FlipCardFront,
	/** The face behind, filling the footprint the front sets. Must be opaque. */
	Back: FlipCardBack,
	/** A control that turns the card. Works under every trigger; the accessible way to turn a swipe card. */
	Trigger: FlipCardTriggerButton,
	displayName: "DelacourUI.FlipCard",
});
