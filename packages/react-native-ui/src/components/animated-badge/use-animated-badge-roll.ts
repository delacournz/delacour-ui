import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import {
	cancelAnimation,
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { AnimatedBadgeAnimatedStyle, AnimatedBadgeFrame } from "./animated-badge.types";
import { ROLL_DISTANCE, ROLL_IN_SPRING, ROLL_OUT_MS } from "./animated-badge.variants";

type RollPhase = "idle" | "exiting" | "entering";

type AnimatedBadgeRoll = {
	/** The frame to draw now — the incoming one, or the outgoing one while it leaves. */
	shown: AnimatedBadgeFrame;
	/** The moving unit's offset and opacity. */
	style: AnimatedBadgeAnimatedStyle;
};

/**
 * Rolls the badge's content from one frame to the next, as one view.
 *
 * On a key change the outgoing content slides toward `-ROLL_DISTANCE` and fades
 * out; only once it is invisible does the held frame swap to the newest one,
 * which then springs in from `+ROLL_DISTANCE`. Never two copies at once, so no
 * frame of the roll can show the old word over the new.
 *
 * A change mid-roll retargets: the exit continues from wherever it is, and the
 * frame that lands is whichever is newest when it finishes — intermediates are
 * skipped. A change back to the frame still on screen returns it home instead.
 *
 * With `isRolling` off (reduce motion) the incoming frame is drawn at once.
 *
 * Announces the new label on iOS once it lands, never on mount. Android needs
 * no call: the root is a polite live region, and its label changes on landing.
 */
export function useAnimatedBadgeRoll({
	frame,
	isRolling,
	announce,
}: {
	frame: AnimatedBadgeFrame;
	isRolling: boolean;
	announce: boolean;
}): AnimatedBadgeRoll {
	const [held, setHeld] = useState(frame);
	const latest = useRef(frame);
	const phase = useRef<RollPhase>("idle");
	const offset = useSharedValue(0);
	const opacity = useSharedValue(1);

	useEffect(() => {
		latest.current = frame;
	});

	const land = (): void => {
		phase.current = "entering";
		setHeld(latest.current);
	};

	// Keyed on the two keys, not on `land` or the frame: a parent re-rendering
	// mid-exit must not restart the exit's clock.
	// biome-ignore lint/correctness/useExhaustiveDependencies: the keys are the re-run trigger, see above
	useEffect(() => {
		if (!isRolling) {
			cancelAnimation(offset);
			cancelAnimation(opacity);
			offset.value = 0;
			opacity.value = 1;
			phase.current = "idle";
			if (latest.current.key !== held.key) setHeld(latest.current);
			return;
		}

		if (frame.key === held.key) {
			if (phase.current !== "exiting") return;
			phase.current = "idle";
			offset.value = withSpring(0, ROLL_IN_SPRING);
			opacity.value = withTiming(1, { duration: ROLL_OUT_MS });
			return;
		}

		phase.current = "exiting";
		const easing = Easing.in(Easing.quad);
		offset.value = withTiming(-ROLL_DISTANCE, { duration: ROLL_OUT_MS, easing });
		opacity.value = withTiming(0, { duration: ROLL_OUT_MS, easing }, (finished) => {
			if (finished) scheduleOnRN(land);
		});
	}, [frame.key, held.key, isRolling, offset, opacity]);

	// After the commit that swapped the content, so the spring never starts on
	// the outgoing word.
	// biome-ignore lint/correctness/useExhaustiveDependencies: `held.key` is the re-run trigger, see above
	useLayoutEffect(() => {
		if (phase.current !== "entering") return;
		phase.current = "idle";
		offset.value = ROLL_DISTANCE;
		offset.value = withSpring(0, ROLL_IN_SPRING);
		opacity.value = withTiming(1, { duration: ROLL_OUT_MS, easing: Easing.out(Easing.quad) });
	}, [held.key, offset, opacity]);

	const landedKey = useRef(held.key);
	const shown = !isRolling || frame.key === held.key ? frame : held;
	useEffect(() => {
		if (landedKey.current === shown.key) return;
		landedKey.current = shown.key;
		if (announce && Platform.OS === "ios" && shown.text !== undefined) {
			AccessibilityInfo.announceForAccessibility(shown.text);
		}
	}, [announce, shown.key, shown.text]);

	const style = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateX: offset.value }],
	}));

	return { shown, style };
}
