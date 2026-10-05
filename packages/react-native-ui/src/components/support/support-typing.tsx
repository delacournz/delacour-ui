import { type ReactElement, useEffect } from "react";
import { View } from "react-native";
import Animated, {
	cancelAnimation,
	ReduceMotion,
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { resolveTypingOpacities } from "./support.utils";
import { supportVariants } from "./support.variants";

/** One dot's fade down and back — two halves of a 900ms cycle. */
const HALF_CYCLE_MS = 450;

/** How far each dot trails the one before it. */
const STAGGER_MS = 150;

/** How low a dot fades at the bottom of its cycle. */
const LOW_OPACITY = 0.3;

/**
 * Starts or stops one dot's loop. `ReduceMotion.Never` on the timings is deliberate: under the
 * default `System` policy a `withTiming` completes instantly while reduce motion is on, and
 * `withRepeat(-1)` would spin a zero-length animation forever. Reduce motion is honoured one level
 * up, through `useCalmMotion`, which never starts the loop.
 */
function drive(dot: SharedValue<number>, index: number, isCalm: boolean, start: number): void {
	cancelAnimation(dot);
	dot.value = start;
	if (isCalm) return;

	const timing = { duration: HALF_CYCLE_MS, reduceMotion: ReduceMotion.Never };
	dot.value = withDelay(
		index * STAGGER_MS,
		withRepeat(withSequence(withTiming(LOW_OPACITY, timing), withTiming(1, timing)), -1, false),
		ReduceMotion.Never
	);
}

/**
 * Three dots saying someone is typing, faded in a staggered loop on the UI thread.
 *
 * The only loop in `Support`, and decorative: under reduce motion or `isMotionCalm` it holds three
 * still dots stepped `1, 0.6, 0.3`, which still reads as typing. Hidden from assistive technology —
 * `Support.Agent` says "is typing" in words. Internal: rendered by `Support.Agent`.
 */
export function SupportTyping({ testID }: { testID?: string }): ReactElement {
	const isCalm = useCalmMotion();
	const [first, second, third] = resolveTypingOpacities(isCalm);
	const one = useSharedValue(first);
	const two = useSharedValue(second);
	const three = useSharedValue(third);

	useEffect(() => {
		const start = resolveTypingOpacities(isCalm);
		drive(one, 0, isCalm, start[0]);
		drive(two, 1, isCalm, start[1]);
		drive(three, 2, isCalm, start[2]);

		return () => {
			cancelAnimation(one);
			cancelAnimation(two);
			cancelAnimation(three);
		};
	}, [isCalm, one, two, three]);

	const oneStyle = useAnimatedStyle(() => ({ opacity: one.value }));
	const twoStyle = useAnimatedStyle(() => ({ opacity: two.value }));
	const threeStyle = useAnimatedStyle(() => ({ opacity: three.value }));
	const slots = supportVariants();

	return (
		<View
			accessibilityElementsHidden
			className={slots.typing()}
			importantForAccessibility="no-hide-descendants"
			testID={testID}
		>
			<Animated.View className={slots.typingDot()} style={oneStyle} />
			<Animated.View className={slots.typingDot()} style={twoStyle} />
			<Animated.View className={slots.typingDot()} style={threeStyle} />
		</View>
	);
}
SupportTyping.displayName = "DelacourUI.Support.Typing";
