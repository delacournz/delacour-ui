import {
	Children,
	type ComponentRef,
	isValidElement,
	type ReactElement,
	type ReactNode,
	type Ref,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { AccessibilityActionEvent, LayoutChangeEvent, ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useControllableState } from "../../hooks/use-controllable-state";
import { IconDefaultsProvider } from "../icon";
import { type HapticFeedback, playHaptic } from "../pressable/pressable";
import {
	type ProgressButtonContextValue,
	ProgressButtonLayerProvider,
	ProgressButtonProvider,
} from "./progress-button.context";
import {
	PROGRESS_BUTTON_CROSSFADE_MS,
	PROGRESS_BUTTON_DEFAULT_HINT,
	PROGRESS_BUTTON_FILL_FOREGROUND_TOKEN,
	PROGRESS_BUTTON_LABEL_TOKEN,
	PROGRESS_BUTTON_MAX_DRIFT,
	PROGRESS_BUTTON_REDUCED_MOTION_STEPS,
	PROGRESS_BUTTON_TRAVEL_MS,
	type ProgressButtonShape,
	type ProgressButtonSize,
	type ProgressButtonVariant,
	progressButtonVariants,
	resolveAutoResetDelay,
	resolveHoldDuration,
	resolveProgressButtonAccessibilityState,
	resolveRemainingDuration,
} from "./progress-button.variants";
import { ProgressButtonDone } from "./progress-button-done";
import { ProgressButtonLabel } from "./progress-button-label";

export type ProgressButtonProps = Omit<ViewProps, "children"> & {
	children: ReactNode;
	className?: string;
	/** The colour the label and the fill carry. Every variant rests on the same surface. */
	variant?: ProgressButtonVariant;
	/** The button's own height, padding, label step and icon step. */
	size?: ProgressButtonSize;
	/** `pill` (the default) takes the button's capsule corner; `rounded` takes `rounded-lg`. */
	shape?: ProgressButtonShape;
	/** Stretch to the parent's width. */
	isFullWidth?: boolean;
	/** How long a full hold takes, in milliseconds. Defaults to 2000, floored at 200. */
	holdDuration?: number;
	/** Called once, when the fill reaches the end. */
	onComplete?: () => void;
	/** Controlled completion. */
	isCompleted?: boolean;
	/** Starting completion while uncontrolled. */
	defaultCompleted?: boolean;
	/** Called with `true` when a hold completes, and `false` when the button resets. */
	onCompletedChange?: (isCompleted: boolean) => void;
	/** Rewind by itself after `autoResetDelay`. Off by default. */
	isAutoReset?: boolean;
	/** How long a completed button waits before `isAutoReset` rewinds it. Defaults to 1000. */
	autoResetDelay?: number;
	isDisabled?: boolean;
	/** Played when the hold takes; a `success` knock follows on completion. Off by default. */
	haptic?: false | HapticFeedback;
	/** Defaults to saying the button has to be held. */
	accessibilityHint?: string;
	ref?: Ref<ComponentRef<typeof Animated.View>>;
};

/**
 * Splits the children into the content drawn on each layer and the caller's
 * `ProgressButton.Done`, if one was written.
 *
 * Consecutive strings collapse into one label, so `Erase {count} files` stays a
 * single piece of text rather than three spaced apart by the row's gap.
 */
function splitChildren(children: ReactNode): { content: ReactNode[]; done: ReactElement | null } {
	const content: ReactNode[] = [];
	let done: ReactElement | null = null;
	let text: string[] = [];

	const flushText = () => {
		if (text.length === 0) return;
		content.push(<ProgressButtonLabel key={`label-${content.length}`}>{text.join("")}</ProgressButtonLabel>);
		text = [];
	};

	for (const child of Children.toArray(children)) {
		if (typeof child === "string" || typeof child === "number") {
			text.push(String(child));
			continue;
		}
		flushText();
		if (isValidElement(child) && child.type === ProgressButtonDone) {
			done = child;
			continue;
		}
		content.push(child);
	}
	flushText();

	return { content, done };
}

function ProgressButtonRoot({
	children,
	className,
	variant = "primary",
	size = "md",
	shape = "pill",
	isFullWidth = false,
	holdDuration: holdDurationProp,
	onComplete,
	isCompleted: isCompletedProp,
	defaultCompleted = false,
	onCompletedChange,
	isAutoReset = false,
	autoResetDelay: autoResetDelayProp,
	isDisabled = false,
	haptic = false,
	accessibilityHint = PROGRESS_BUTTON_DEFAULT_HINT,
	onLayout,
	ref,
	...props
}: ProgressButtonProps): ReactElement {
	const holdDuration = resolveHoldDuration(holdDurationProp);
	const autoResetDelay = resolveAutoResetDelay(autoResetDelayProp);
	const isReducedMotion = useReducedMotion();

	const [isCompleted, setCompleted] = useControllableState<boolean>({
		defaultValue: defaultCompleted,
		onChange: onCompletedChange,
		value: isCompletedProp,
	});

	// Bumped by every completed hold. A controlled caller that does not accept
	// the completion leaves `isCompleted` false, and without a change to key on
	// the button would sit full and locked forever; this is the change.
	const [holdCount, setHoldCount] = useState(0);

	const progress = useSharedValue(isCompleted ? 1 : 0);
	// 1 while completed: the gesture worklets read it to refuse a new hold and to
	// leave a completed fill where it is on release.
	const isLocked = useSharedValue(isCompleted ? 1 : 0);
	const isHolding = useSharedValue(0);
	const completion = useSharedValue(isCompleted ? 1 : 0);
	const boxWidth = useSharedValue(0);
	const [measuredWidth, setMeasuredWidth] = useState(0);

	const complete = useCallback(() => {
		setCompleted(true);
		onComplete?.();
		setHoldCount((count) => count + 1);
	}, [onComplete, setCompleted]);

	// Follows `isCompleted` whichever side moved it. A completion travels the
	// fill to the end (already there after a hold); a reset travels it back.
	// Neither is ever a jump.
	// biome-ignore lint/correctness/useExhaustiveDependencies: `holdCount` is the re-run trigger, not a value read
	useEffect(() => {
		completion.value = withTiming(isCompleted ? 1 : 0, {
			duration: PROGRESS_BUTTON_CROSSFADE_MS,
			reduceMotion: ReduceMotion.Never,
		});

		if (isCompleted) {
			isLocked.value = 1;
			const remaining = resolveRemainingDuration({
				direction: "forward",
				holdDuration: PROGRESS_BUTTON_TRAVEL_MS,
				progress: progress.value,
			});
			if (remaining > 0) {
				progress.value = withTiming(1, {
					duration: remaining,
					easing: Easing.out(Easing.cubic),
					reduceMotion: ReduceMotion.Never,
				});
			}
			return;
		}

		if (isLocked.value === 1) {
			isLocked.value = 0;
			progress.value = withTiming(0, {
				duration: resolveRemainingDuration({
					direction: "reverse",
					holdDuration: PROGRESS_BUTTON_TRAVEL_MS,
					progress: progress.value,
				}),
				easing: Easing.inOut(Easing.cubic),
				reduceMotion: ReduceMotion.Never,
			});
		}
	}, [completion, holdCount, isCompleted, isLocked, progress]);

	useEffect(() => {
		if (!isCompleted || !isAutoReset) return;
		const timer = setTimeout(() => setCompleted(false), autoResetDelay);
		return () => clearTimeout(timer);
	}, [autoResetDelay, isAutoReset, isCompleted, setCompleted]);

	// A pan with no minimum distance begins on touch-down and finalizes on
	// release or cancel, which is the whole hold. A long-press gesture fires once
	// and cannot tell "still holding" from "held long enough".
	const gesture = useMemo(
		() =>
			Gesture.Pan()
				.minDistance(0)
				.enabled(!isDisabled)
				.shouldCancelWhenOutside(false)
				.onBegin(() => {
					"worklet";
					if (isLocked.value === 1) return;
					isHolding.value = 1;
					if (haptic) playHaptic(haptic);
					const from = Math.min(1, Math.max(0, progress.value));
					progress.value = withTiming(
						1,
						{ duration: holdDuration * (1 - from), easing: Easing.linear, reduceMotion: ReduceMotion.Never },
						(finished) => {
							"worklet";
							if (!finished || isLocked.value === 1) return;
							isLocked.value = 1;
							isHolding.value = 0;
							if (haptic) playHaptic("success");
							scheduleOnRN(complete);
						}
					);
				})
				.onUpdate((event) => {
					"worklet";
					if (isHolding.value === 0 || isLocked.value === 1) return;
					const drift = event.translationX * event.translationX + event.translationY * event.translationY;
					if (drift <= PROGRESS_BUTTON_MAX_DRIFT * PROGRESS_BUTTON_MAX_DRIFT) return;
					isHolding.value = 0;
					const from = Math.min(1, Math.max(0, progress.value));
					progress.value = withTiming(0, {
						duration: holdDuration * from,
						easing: Easing.linear,
						reduceMotion: ReduceMotion.Never,
					});
				})
				.onFinalize(() => {
					"worklet";
					if (isHolding.value === 0 || isLocked.value === 1) return;
					isHolding.value = 0;
					const from = Math.min(1, Math.max(0, progress.value));
					progress.value = withTiming(0, {
						duration: holdDuration * from,
						easing: Easing.linear,
						reduceMotion: ReduceMotion.Never,
					});
				}),
		[complete, haptic, holdDuration, isDisabled, isHolding, isLocked, progress]
	);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { width } = event.nativeEvent.layout;
			boxWidth.value = width;
			setMeasuredWidth(width);
			onLayout?.(event);
		},
		[boxWidth, onLayout]
	);

	// A screen reader cannot hold, so activating completes outright. The hint
	// has already said what the button does.
	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (event.nativeEvent.actionName !== "activate") return;
			if (isDisabled || isCompleted) return;
			isLocked.value = 1;
			complete();
		},
		[complete, isCompleted, isDisabled, isLocked]
	);

	const fillStyle = useAnimatedStyle(() => {
		const p = progress.value;
		const steps = PROGRESS_BUTTON_REDUCED_MOTION_STEPS;
		const shown = isReducedMotion && p < 1 ? Math.floor(Math.max(0, p) * steps) / steps : p;
		return { width: shown * boxWidth.value };
	});

	// One style per view: each copy of the labels fades on its own binding.
	const labelsStyle = useAnimatedStyle(() => ({ opacity: 1 - completion.value }));
	const fillLabelsStyle = useAnimatedStyle(() => ({ opacity: 1 - completion.value }));

	const doneStyle = useAnimatedStyle(() => ({
		opacity: completion.value,
		transform: [{ scale: isReducedMotion ? 1 : 0.6 + 0.4 * completion.value }],
	}));

	const context = useMemo<ProgressButtonContextValue>(
		() => ({ isCompleted, isDisabled, progress, size, variant }),
		[isCompleted, isDisabled, progress, size, variant]
	);

	const { content, done } = useMemo(() => splitChildren(children), [children]);

	const slots = progressButtonVariants({ isDisabled, isFullWidth, shape, size, variant });
	const iconClass = slots.icon();
	const surfaceIcons = useMemo(
		() => ({ className: iconClass, color: PROGRESS_BUTTON_LABEL_TOKEN[variant] }),
		[iconClass, variant]
	);
	const fillIcons = useMemo(
		() => ({ className: iconClass, color: PROGRESS_BUTTON_FILL_FOREGROUND_TOKEN[variant] }),
		[iconClass, variant]
	);
	const innerWidth = { width: measuredWidth };

	// The fill copy and the done mark are hidden from assistive technology: the
	// root is the one accessible element, and the surface copy already names it.
	return (
		<ProgressButtonProvider value={context}>
			<GestureDetector gesture={gesture}>
				<Animated.View
					accessibilityActions={[{ name: "activate" }]}
					accessibilityHint={accessibilityHint}
					accessibilityRole="button"
					accessibilityState={resolveProgressButtonAccessibilityState({ isCompleted, isDisabled })}
					accessible
					className={slots.root({ className })}
					onAccessibilityAction={handleAccessibilityAction}
					onLayout={handleLayout}
					ref={ref}
					{...props}
				>
					<Animated.View className={slots.content()} style={labelsStyle}>
						<ProgressButtonLayerProvider value="surface">
							<IconDefaultsProvider value={surfaceIcons}>{content}</IconDefaultsProvider>
						</ProgressButtonLayerProvider>
					</Animated.View>
					<Animated.View
						accessibilityElementsHidden
						className={slots.fill()}
						importantForAccessibility="no-hide-descendants"
						pointerEvents="none"
						style={fillStyle}
					>
						<Animated.View className={slots.fillContent()} style={[innerWidth, fillLabelsStyle]}>
							<ProgressButtonLayerProvider value="fill">
								<IconDefaultsProvider value={fillIcons}>{content}</IconDefaultsProvider>
							</ProgressButtonLayerProvider>
						</Animated.View>
						<Animated.View className={slots.done()} style={[innerWidth, doneStyle]}>
							<ProgressButtonLayerProvider value="fill">
								<IconDefaultsProvider value={fillIcons}>{done ?? <ProgressButtonDone />}</IconDefaultsProvider>
							</ProgressButtonLayerProvider>
						</Animated.View>
					</Animated.View>
				</Animated.View>
			</GestureDetector>
		</ProgressButtonProvider>
	);
}

/**
 * A button that has to be held, not tapped.
 *
 * A fill grows from the leading edge for `holdDuration` and the action fires
 * when it reaches the end — never before, with no tolerance near it. Released
 * early, the fill plays back at the rate it went in; pressed again, it resumes
 * from where it is. For an irreversible action that would otherwise need a
 * confirmation dialog: two taps are a rhythm a hand falls into, a two-second
 * hold cannot be done by habit.
 *
 * Completion is read off the fill's own animation, then the labels cross-fade
 * to `ProgressButton.Done` — a tick unless the caller writes one. It stays
 * completed until `isAutoReset` rewinds it, or a controlled `isCompleted` goes
 * `false`; either way the fill travels back rather than jumping.
 *
 * A screen reader cannot hold, so its activate action completes the button
 * outright; the default hint says it must be held.
 *
 * @example
 * <ProgressButton onComplete={erase} variant="destructive">
 *   <ProgressButton.Label>Hold to erase</ProgressButton.Label>
 * </ProgressButton>
 *
 * @example
 * <ProgressButton isAutoReset haptic="medium" onComplete={pay} variant="success">
 *   <Icon icon={IconCreditCard1} />
 *   <ProgressButton.Label>Hold to pay</ProgressButton.Label>
 *   <ProgressButton.Done>
 *     <ProgressButton.Label>Paid</ProgressButton.Label>
 *   </ProgressButton.Done>
 * </ProgressButton>
 */
export const ProgressButton = Object.assign(ProgressButtonRoot, {
	/** The button's text, drawn once on the surface and once inside the fill. */
	Label: ProgressButtonLabel,
	/** What shows once the hold completes. A tick when omitted. */
	Done: ProgressButtonDone,
	displayName: "DelacourUI.ProgressButton",
});
