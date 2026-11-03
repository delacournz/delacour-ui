import { type ReactElement, useEffect, useMemo, useState } from "react";
import { type LayoutChangeEvent, Text as NativeText, View } from "react-native";
import Animated, {
	Easing,
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { cn } from "../../lib/cn";
import type { TextAnimationBase } from "./text-animation.types";
import {
	resolveNextPhrase,
	resolveSwapProgress,
	resolveWidestPhrase,
	TEXT_ANIMATION_ROTATE_DISTANCE,
	TEXT_ANIMATION_ROTATE_INTERVAL_MS,
	TEXT_ANIMATION_ROTATE_TRANSITION_MS,
	type TextAnimationTransition,
	textAnimationVariants,
} from "./text-animation.variants";
import { useTextAnimationClass } from "./text-animation-unit";

export type TextAnimationRotatingProps = TextAnimationBase & {
	/** The phrases to cycle through. At least one; a single phrase never moves. */
	phrases: readonly string[];
	/** How long each phrase holds, ms. Default 2200. */
	intervalMs?: number;
	/** How one phrase gives way to the next. `slide` is vertical. Default `{ kind: "fade" }`. */
	transition?: TextAnimationTransition;
	/** The swap itself, ms. Default 360. */
	transitionMs?: number;
	/** `widest` holds the widest phrase's width so a sentence does not reflow; `current` fits each phrase. Default `widest`. */
	reserve?: "widest" | "current";
	/** `false` holds the current phrase. Default `true`. */
	isActive?: boolean;
};

const DEFAULT_TRANSITION: TextAnimationTransition = { kind: "fade" };

const slots = textAnimationVariants();

type RotatingLayerProps = {
	text: string;
	phase: "enter" | "exit";
	progress: SharedValue<number>;
	/** The swap `progress` has been rewound for. */
	swap: SharedValue<number>;
	/** The swap this layer was rendered for — it holds its start until `swap` catches up. */
	swapId: number;
	isSwapping: boolean;
	distance: number;
	className: string;
	allowFontScaling?: boolean;
	maxFontSizeMultiplier?: number;
};

/**
 * One phrase over the slot — the one arriving or the one leaving. Both read
 * the same progress, so the swap is a single animation however fast the
 * interval runs. Progress rewinds in an effect, after the layers mount, so a
 * layer waits for `swap` to reach its own swap before it follows progress.
 */
function TextAnimationRotatingLayer({
	text,
	phase,
	progress,
	swap,
	swapId,
	isSwapping,
	distance,
	className,
	allowFontScaling,
	maxFontSizeMultiplier,
}: RotatingLayerProps): ReactElement {
	const style = useAnimatedStyle(() => {
		const t = resolveSwapProgress(isSwapping, swap.value, swapId, progress.value);
		if (phase === "enter") return { opacity: t, transform: [{ translateY: (1 - t) * distance }] };
		return { opacity: 1 - t, transform: [{ translateY: -t * distance }] };
	});
	return (
		<Animated.Text
			allowFontScaling={allowFontScaling}
			className={cn(className, slots.layer())}
			maxFontSizeMultiplier={maxFontSizeMultiplier}
			numberOfLines={1}
			style={style}
		>
			{text}
		</Animated.Text>
	);
}
TextAnimationRotatingLayer.displayName = "DelacourUI.TextAnimation.Rotating.Layer";

/**
 * Swaps one phrase for the next in place — one word inside a sentence.
 *
 * The index is JS state advanced by a timer, not a frame loop: nothing moves
 * between swaps, so nothing needs to tick. The box is held at the widest
 * phrase's width by an invisible copy in flow, so the sentence around it does
 * not reflow on every swap. Under calm motion the first phrase holds — a
 * rotating word is a loop.
 */
export function TextAnimationRotating({
	phrases,
	intervalMs = TEXT_ANIMATION_ROTATE_INTERVAL_MS,
	transition = DEFAULT_TRANSITION,
	transitionMs = TEXT_ANIMATION_ROTATE_TRANSITION_MS,
	reserve = "widest",
	isActive = true,
	variant,
	size,
	weight,
	color,
	align,
	transform,
	className,
	allowFontScaling,
	maxFontSizeMultiplier,
	testID,
	nativeID,
	accessibilityHint,
}: TextAnimationRotatingProps): ReactElement {
	const isCalm = useCalmMotion();
	const textClass = useTextAnimationClass({ variant, size, weight, color, align, transform, className });
	const phrasesKey = phrases.join("\u0000");
	// `swapId` counts every swap, so each one's layers know which rewind is theirs.
	const [state, setState] = useState({ key: phrasesKey, index: 0, previous: -1, swapId: 0 });
	// A new list starts over, committed during render, so switching away and
	// back never restores the old list's index or its transition.
	if (state.key !== phrasesKey) setState({ key: phrasesKey, index: 0, previous: -1, swapId: state.swapId });
	// Calm motion holds the first phrase with no swap in flight.
	const { index, previous, swapId } =
		state.key === phrasesKey && !isCalm ? state : { index: 0, previous: -1, swapId: state.swapId };
	const progress = useSharedValue(1);
	const swap = useSharedValue(0);
	const isRotating = isActive && !isCalm && phrases.length > 1;

	useEffect(() => {
		if (!isRotating) return;
		const timer = setInterval(() => {
			setState((current) => {
				const from = current.key === phrasesKey ? current.index : 0;
				const next = resolveNextPhrase(from, phrases.length, true) ?? from;
				return { key: phrasesKey, index: next, previous: from, swapId: current.swapId + 1 };
			});
		}, intervalMs);
		return () => clearInterval(timer);
	}, [isRotating, intervalMs, phrasesKey, phrases.length]);

	// Turning calm motion on drops the rotated state, so resuming waits for the
	// next swap instead of replaying the transition that was cut short.
	useEffect(() => {
		if (isCalm) setState((current) => ({ key: phrasesKey, index: 0, previous: -1, swapId: current.swapId }));
	}, [isCalm, phrasesKey]);

	// `swap` is written after the rewind, so a frame between the writes still
	// holds the layers at their start.
	useEffect(() => {
		if (previous < 0) {
			progress.value = 1;
			return;
		}
		progress.value = 0;
		swap.value = swapId;
		progress.value = withTiming(1, { duration: transitionMs, easing: Easing.out(Easing.cubic) });
	}, [swapId, previous, transitionMs, progress, swap]);

	const [widths, setWidths] = useState<Readonly<Record<string, number>>>({});
	const guess = useMemo(() => resolveWidestPhrase(phrases), [phrases]);
	const widest = useMemo(() => {
		let best = guess;
		let bestWidth = widths[phrases[guess] ?? ""] ?? -1;
		phrases.forEach((phrase, i) => {
			const width = widths[phrase];
			if (width !== undefined && width > bestWidth) {
				best = i;
				bestWidth = width;
			}
		});
		return best;
	}, [phrases, widths, guess]);
	const onMeasure = (phrase: string) => (event: LayoutChangeEvent) => {
		const width = event.nativeEvent.layout.width;
		setWidths((current) => (current[phrase] === width ? current : { ...current, [phrase]: width }));
	};

	const shown = phrases[index] ?? "";
	const leaving = previous >= 0 ? phrases[previous] : undefined;
	const reserved = reserve === "widest" ? (phrases[widest] ?? shown) : shown;
	const distance = transition.kind === "slide" ? (transition.distance ?? TEXT_ANIMATION_ROTATE_DISTANCE) : 0;
	const textProps = { allowFontScaling, maxFontSizeMultiplier };

	// The in-flow copy sizes the slot; the hidden measures settle which phrase
	// really is widest once they have laid out; the layers draw over the slot.
	return (
		<View
			accessibilityHint={accessibilityHint}
			accessibilityLabel={shown}
			accessibilityRole="text"
			accessible
			className={slots.slot()}
			nativeID={nativeID}
			testID={testID}
		>
			<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
				<NativeText {...textProps} className={cn(textClass, "opacity-0")} numberOfLines={1}>
					{reserved}
				</NativeText>
				{reserve === "widest" && (
					<View className={slots.probe()}>
						{phrases.map((phrase, i) => (
							<NativeText
								{...textProps}
								className={textClass}
								key={`${i}-${phrase}`}
								numberOfLines={1}
								onLayout={onMeasure(phrase)}
							>
								{phrase}
							</NativeText>
						))}
					</View>
				)}
				{leaving !== undefined && (
					<TextAnimationRotatingLayer
						{...textProps}
						className={textClass}
						distance={distance}
						isSwapping
						key={`exit-${previous}`}
						progress={progress}
						swap={swap}
						swapId={swapId}
						phase="exit"
						text={leaving}
					/>
				)}
				<TextAnimationRotatingLayer
					{...textProps}
					className={textClass}
					distance={distance}
					isSwapping={leaving !== undefined}
					key={`enter-${index}`}
					progress={progress}
					swap={swap}
					swapId={swapId}
					phase="enter"
					text={shown}
				/>
			</View>
		</View>
	);
}
TextAnimationRotating.displayName = "DelacourUI.TextAnimation.Rotating";
