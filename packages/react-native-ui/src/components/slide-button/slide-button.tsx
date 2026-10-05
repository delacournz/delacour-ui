import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from "react";
import { type AccessibilityActionEvent, I18nManager, type LayoutChangeEvent, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	cancelAnimation,
	type SharedValue,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useControllableState } from "../../hooks/use-controllable-state";
import { type HapticFeedback, playHaptic } from "../pressable";
import { type SlideButtonContextValue, SlideButtonProvider } from "./slide-button.context";
import {
	isSlideArmed,
	resolveSlideHandleWidth,
	resolveSlideRelease,
	resolveSlideThreshold,
	resolveSlideTrailOpacity,
	resolveSlideTrailWidth,
	resolveSlideTravel,
	SLIDE_BUTTON_ACTIVE_OFFSET_X,
	SLIDE_BUTTON_DEFAULT_AUTO_RESET_MS,
	SLIDE_BUTTON_DEFAULT_SIZE,
	SLIDE_BUTTON_DEFAULT_VARIANT,
	SLIDE_BUTTON_FAIL_OFFSET_Y,
	SLIDE_BUTTON_GLYPH_MS,
	SLIDE_BUTTON_INSET,
	SLIDE_BUTTON_LOOKAHEAD,
	SLIDE_BUTTON_REDUCED_MOTION_MS,
	SLIDE_BUTTON_SPRING,
	type SlideButtonSize,
	type SlideButtonVariant,
	slideButtonVariants,
} from "./slide-button.variants";
import { SlideButtonLabel } from "./slide-button-label";
import { SlideButtonThumb } from "./slide-button-thumb";

export type SlideButtonProps = Omit<ViewProps, "children" | "style"> & {
	children: ReactNode;
	/** Classes for the rail. */
	className?: string;
	variant?: SlideButtonVariant;
	size?: SlideButtonSize;
	/** Stretches the rail across its parent. Otherwise it is a fixed 288pt. */
	isFullWidth?: boolean;
	/** How far along the travel a release has to reach, as a fraction from 0.1 to 1. Default 0.9. */
	threshold?: number;
	/**
	 * Called once when the slide confirms. Return a promise and a rejection takes
	 * the handle home again, so a failed request does not look confirmed.
	 */
	onComplete?: () => void;
	/** Controlled state. Pass nothing and the button holds its own. */
	isCompleted?: boolean;
	/** Starting state while uncontrolled. */
	defaultCompleted?: boolean;
	onCompletedChange?: (isCompleted: boolean) => void;
	/** Takes the handle home on its own, `autoResetDelay` after it confirms. */
	isAutoReset?: boolean;
	/** In milliseconds. Default 1000. */
	autoResetDelay?: number;
	/** Fades the control and refuses the drag — the handle does not move at all. */
	isDisabled?: boolean;
	/** Played as a drag crosses the threshold; a success knock follows on commit. Off by default. */
	haptic?: false | HapticFeedback;
	/** What the screen reader's activate action is called. Imperative, naming the outcome. Default "Confirm". */
	accessibilityActionLabel?: string;
};

function SlideButtonRoot({
	children,
	className,
	variant = SLIDE_BUTTON_DEFAULT_VARIANT,
	size = SLIDE_BUTTON_DEFAULT_SIZE,
	isFullWidth = false,
	threshold,
	onComplete,
	isCompleted,
	defaultCompleted = false,
	onCompletedChange,
	isAutoReset = false,
	autoResetDelay = SLIDE_BUTTON_DEFAULT_AUTO_RESET_MS,
	isDisabled = false,
	haptic = false,
	accessibilityActionLabel = "Confirm",
	accessibilityLabel,
	...props
}: SlideButtonProps): ReactElement {
	const [completed, setCompleted] = useControllableState({
		defaultValue: defaultCompleted,
		onChange: onCompletedChange,
		value: isCompleted,
	});

	const isRTL = I18nManager.isRTL;
	const direction = isRTL ? -1 : 1;
	const isReducedMotion = useReducedMotion();
	const resolvedThreshold = resolveSlideThreshold(threshold);

	const offset = useSharedValue(0);
	const travel = useSharedValue(0);
	const handleWidth = useSharedValue(0);
	const glyph = useSharedValue(completed ? 1 : 0);
	// Where the handle was when the drag took hold, so picking it up mid-spring
	// does not snap it to the finger.
	const grabbed = useSharedValue(0);
	// Whether the current drag has crossed the threshold — the arming haptic
	// fires on the crossing, not on every frame past it.
	const armed = useSharedValue(false);
	// Whether the handle belongs at the far end: confirmed, or requested and not
	// yet answered. A pinned handle takes no drag and follows a re-layout.
	const pinned = useSharedValue(completed);

	// A request is in flight: the drag confirmed, `onComplete` ran, and a
	// controlled parent has not said `isCompleted` yet. A ref, because nothing
	// renders differently for it — the handle already sits at the end.
	const isPending = useRef(false);

	const moveTo = useCallback(
		(target: number) => {
			offset.value = isReducedMotion
				? withTiming(target, { duration: SLIDE_BUTTON_REDUCED_MOTION_MS })
				: withSpring(target, SLIDE_BUTTON_SPRING);
		},
		[isReducedMotion, offset]
	);

	const goHome = useCallback(() => {
		pinned.value = false;
		moveTo(0);
		glyph.value = withTiming(0, { duration: SLIDE_BUTTON_GLYPH_MS });
	}, [glyph, moveTo, pinned]);

	const onCompleteRef = useRef(onComplete);
	onCompleteRef.current = onComplete;

	const reject = useCallback(() => {
		isPending.current = false;
		setCompleted(false);
		goHome();
	}, [goHome, setCompleted]);

	const complete = useCallback(() => {
		isPending.current = true;
		setCompleted(true);
		// Typed `void` so any function fits; read as `unknown` to find a promise in it.
		const result: unknown = onCompleteRef.current?.();
		if (isPromiseLike(result)) result.then(undefined, reject);
	}, [reject, setCompleted]);

	useEffect(() => {
		if (completed) {
			isPending.current = false;
			pinned.value = true;
			moveTo(travel.value);
			glyph.value = withTiming(1, { duration: SLIDE_BUTTON_GLYPH_MS });
			return;
		}
		// Completion was requested and has not been answered. The handle stays at
		// the end rather than springing back, which would read as a refusal.
		if (isPending.current) return;
		goHome();
	}, [completed, glyph, goHome, moveTo, pinned, travel]);

	useEffect(() => () => cancelAnimation(offset), [offset]);

	useEffect(() => {
		if (!completed || !isAutoReset) return;
		const timer = setTimeout(() => setCompleted(false), autoResetDelay);
		return () => clearTimeout(timer);
	}, [autoResetDelay, completed, isAutoReset, setCompleted]);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			const nextHandle = resolveSlideHandleWidth({ inset: SLIDE_BUTTON_INSET, railHeight: height });
			const nextTravel = resolveSlideTravel({ handleWidth: nextHandle, inset: SLIDE_BUTTON_INSET, railWidth: width });
			handleWidth.value = nextHandle;
			travel.value = nextTravel;
			if (pinned.value) offset.value = nextTravel;
			else if (offset.value > nextTravel) offset.value = nextTravel;
		},
		[handleWidth, offset, pinned, travel]
	);

	const gesture = useMemo(() => {
		const settle = (target: number, velocity: number) => {
			"worklet";
			offset.value = isReducedMotion
				? withTiming(target, { duration: SLIDE_BUTTON_REDUCED_MOTION_MS })
				: withSpring(target, { ...SLIDE_BUTTON_SPRING, velocity });
		};

		// Disabled still claims the drag and then does nothing with it. A disabled
		// recognizer lets the touch through to whatever sits behind — inside a
		// stack with a full-screen back swipe, a drag on a refused slide navigated
		// back.
		return Gesture.Pan()
			.activeOffsetX([-SLIDE_BUTTON_ACTIVE_OFFSET_X, SLIDE_BUTTON_ACTIVE_OFFSET_X])
			.failOffsetY([-SLIDE_BUTTON_FAIL_OFFSET_Y, SLIDE_BUTTON_FAIL_OFFSET_Y])
			.onStart(() => {
				"worklet";
				if (isDisabled || pinned.value) return;
				cancelAnimation(offset);
				grabbed.value = offset.value;
				armed.value = false;
			})
			.onUpdate((event) => {
				"worklet";
				const span = travel.value;
				if (isDisabled || pinned.value || span <= 0) return;

				// No easing on the way out: the handle tracks the finger exactly.
				const next = Math.min(span, Math.max(0, grabbed.value + event.translationX * direction));
				offset.value = next;

				// The tick plays on the crossing, not on every frame past it, and
				// re-arms if the drag drops back under.
				const isArmed = isSlideArmed({ offset: next, threshold: resolvedThreshold, travel: span });
				if (isArmed === armed.value) return;
				armed.value = isArmed;
				if (isArmed && haptic !== false) playHaptic(haptic);
			})
			.onEnd((event, success) => {
				"worklet";
				if (isDisabled || pinned.value) return;
				armed.value = false;
				const velocity = event.velocityX * direction;
				const release = resolveSlideRelease({
					lookahead: SLIDE_BUTTON_LOOKAHEAD,
					offset: offset.value,
					threshold: resolvedThreshold,
					travel: travel.value,
					velocity,
				});

				// A pan cancelled by a scroll taking over goes home whatever its position.
				if (!success || release === "return") {
					settle(0, velocity);
					return;
				}

				pinned.value = true;
				settle(travel.value, velocity);
				if (haptic !== false) playHaptic("success");
				scheduleOnRN(complete);
			});
	}, [
		armed,
		complete,
		direction,
		grabbed,
		haptic,
		isDisabled,
		isReducedMotion,
		offset,
		pinned,
		resolvedThreshold,
		travel,
	]);

	const activate = useCallback(() => {
		if (isDisabled || pinned.value) return;
		pinned.value = true;
		moveTo(travel.value);
		complete();
	}, [complete, isDisabled, moveTo, pinned, travel]);

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (event.nativeEvent.actionName === "activate") activate();
		},
		[activate]
	);

	const accessibilityActions = useMemo(
		() => [{ label: accessibilityActionLabel, name: "activate" }],
		[accessibilityActionLabel]
	);

	const context = useMemo<SlideButtonContextValue>(
		() => ({
			glyph,
			handleWidth,
			isCompleted: completed,
			isDisabled,
			isRTL,
			offset,
			size,
			travel,
			variant,
		}),
		[completed, glyph, handleWidth, isDisabled, offset, size, travel, variant]
	);

	const content = useMemo(() => withThumb(children), [children]);
	const label = accessibilityLabel ?? labelText(children);
	const slots = slideButtonVariants({ isDisabled, isFullWidth, size, variant });

	return (
		<SlideButtonProvider value={context}>
			<GestureDetector gesture={gesture}>
				<Animated.View
					accessibilityActions={accessibilityActions}
					accessibilityLabel={label}
					accessibilityRole="button"
					accessibilityState={{ checked: completed, disabled: isDisabled }}
					accessible
					className={slots.root({ className })}
					onAccessibilityAction={handleAccessibilityAction}
					onAccessibilityTap={activate}
					onLayout={handleLayout}
					{...props}
				>
					<SlideButtonTrail className={slots.trail()} handleWidth={handleWidth} offset={offset} />
					{content}
				</Animated.View>
			</GestureDetector>
		</SlideButtonProvider>
	);
}

/**
 * The fill behind the handle, from the rail's start edge to the handle's middle.
 *
 * It ends *under* the handle rather than at its rear edge: a stadium's rear is a
 * curve, and a trail that stopped at its straight edge would leave a sliver of
 * rail showing above and below that curve. Ending under the handle means the two
 * read as one shape — the handle dragging its colour along.
 *
 * Internal: the root renders it, so it lives here rather than in a part file.
 */
function SlideButtonTrail({
	className,
	offset,
	handleWidth,
}: {
	className: string;
	offset: SharedValue<number>;
	handleWidth: SharedValue<number>;
}): ReactElement {
	const style = useAnimatedStyle(() => ({
		opacity: handleWidth.value > 0 ? resolveSlideTrailOpacity(offset.value) : 0,
		width: resolveSlideTrailWidth({ handleWidth: handleWidth.value, inset: SLIDE_BUTTON_INSET, offset: offset.value }),
	}));
	return <Animated.View className={className} style={style} />;
}
SlideButtonTrail.displayName = "DelacourUI.SlideButton.Trail";

/**
 * Composes a `SlideButton.Thumb` in when the children hold none, and puts it
 * last however it was written, so the handle always passes over the label —
 * `Switch`'s rule for its thumb, for the same reason.
 */
function withThumb(children: ReactNode): ReactNode {
	const items = Children.toArray(children);
	const isThumb = items.map((child) => isPart(child, SlideButtonThumb));

	if (!isThumb.includes(true)) return [...items, <SlideButtonThumb key="thumb" />];

	return [...items.filter((_, index) => !isThumb[index]), ...items.filter((_, index) => isThumb[index])];
}

/**
 * The label's text, for the rail's accessibility label.
 *
 * Only plain text is read. A label holding anything richer needs an explicit
 * `accessibilityLabel` on the root.
 */
function labelText(children: ReactNode): string | undefined {
	for (const child of Children.toArray(children)) {
		if (!isPart(child, SlideButtonLabel) || !isValidElement<{ children?: ReactNode }>(child)) continue;
		const parts = Children.toArray(child.props.children).filter(
			(part): part is string | number => typeof part === "string" || typeof part === "number"
		);
		if (parts.length > 0) return parts.join("");
	}
	return undefined;
}

/** Whether `onComplete` handed back something to wait on. */
function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
	return typeof value === "object" && value !== null && typeof (value as { then?: unknown }).then === "function";
}

/**
 * Whether a child is a given part — by identity first, then by `displayName`,
 * which survives React Compiler and a second module instance where identity does
 * not. See `isSwitchThumbElement` for the afternoon that rule cost.
 */
function isPart(child: ReactNode, part: { displayName?: string }): boolean {
	if (!isValidElement(child)) return false;
	if (child.type === part) return true;

	const type = child.type as { displayName?: string } | null;
	return type?.displayName !== undefined && type.displayName === part.displayName;
}

/**
 * A control confirmed by dragging a handle across a rail — "Slide to ship".
 *
 * For an action that deserves deliberation where a dialog would be too much
 * ceremony: a stray tap cannot reach it, and neither can habit. The handle tracks
 * the finger exactly; only the release is sprung. A release past `threshold`
 * (0.9 by default) confirms, with a small look-ahead so a committed flick near
 * the end counts — but a flick from halfway never does, and `threshold={1}`
 * demands the far end.
 *
 * **State works either way.** Uncontrolled, the handle confirms and stays at the
 * end, ticked. Controlled, a confirmed slide reports `onCompletedChange(true)` and
 * the handle waits at the end until `isCompleted` answers — so slow work shows as
 * a held handle, not a bounce. `isAutoReset` takes it home after `autoResetDelay`.
 *
 * The label is centred in the whole rail and never fades. A `SlideButton.Thumb` is
 * composed in when none is written; write one to put a different glyph on the handle.
 *
 * Under RTL the handle rests at the right and travels left. A screen reader's
 * activate confirms it outright, named by `accessibilityActionLabel`.
 *
 * @example
 * <SlideButton onComplete={ship}>
 *   <SlideButton.Label>Slide to ship</SlideButton.Label>
 * </SlideButton>
 *
 * @example
 * <SlideButton variant="destructive" threshold={1} accessibilityActionLabel="Delete account" onComplete={remove}>
 *   <SlideButton.Label>Slide to delete</SlideButton.Label>
 * </SlideButton>
 *
 * @example
 * <SlideButton isFullWidth haptic="selection" onComplete={unlock}>
 *   <SlideButton.Label>Slide to unlock</SlideButton.Label>
 *   <SlideButton.Thumb>
 *     <Icon icon={IconUnlocked} />
 *   </SlideButton.Thumb>
 * </SlideButton>
 */
export const SlideButton = Object.assign(SlideButtonRoot, {
	/** What the slide does, centred in the rail. Never fades. */
	Label: SlideButtonLabel,
	/** The handle. Composed in automatically; write it out to change its glyph. */
	Thumb: SlideButtonThumb,
	displayName: "DelacourUI.SlideButton",
});
