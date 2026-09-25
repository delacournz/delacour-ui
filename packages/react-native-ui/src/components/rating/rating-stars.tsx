import { type ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { type AccessibilityActionEvent, type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useThemeColor } from "../../hooks/use-theme-color";
import { playHaptic } from "../pressable";
import { useRatingPart } from "./rating.context";
import {
	describeRating,
	ratingFromOffset,
	ratingVariants,
	resolveRatingPaint,
	shouldClearRating,
	starFillOf,
	stepRating,
} from "./rating.variants";
import { RatingStar } from "./rating-star";

export type RatingStarsProps = Omit<ViewProps, "children" | "style"> & {
	className?: string;
};

/**
 * The row of stars, the surface the gesture is claimed on, and the whole
 * accessibility surface.
 *
 * **It is not a `Pressable`, and neither is a star.** The reasons are
 * `Slider.Track`'s: `Pressable`'s tap fires `onPress` on every touch-to-set, and a
 * `Pressable` per star would nest five taps inside the row's pan and leave them
 * to negotiate for one drag. One `Gesture.Pan()` on the row reads the star under
 * the finger, on touch-down and throughout the drag. What is inherited is the
 * vocabulary — `playHaptic` from `pressable.tsx`, the one haptic switch.
 *
 * **The value is written in `onBegin`**, because a pan activates on the first
 * movement and a stationary tap would otherwise never set anything.
 * `minDistance(0)` wins the touch from an enclosing scroll view, and
 * `shouldCancelWhenOutside(false)` keeps a drag past the last star tracking it.
 * `onFinalize` is where a clear is decided and the gesture reported finished,
 * because it is the one callback that fires on every path.
 *
 * **The stars render from React state; the gesture reads a shared value.** A
 * rating crosses at most a handful of stops in a drag, so a commit per crossing
 * is a handful of commits and no mirror on the UI thread is worth its code. The
 * shared value exists so the worklet can tell a crossing from a repeat without
 * waiting on a render, and it is re-synced from React whenever the gesture ends —
 * which is what snaps a controlled rating back when its parent rejects a value.
 *
 * **To assistive technology the row is one `adjustable` control.** Its value is
 * spoken as "3.5 out of 5" and a swipe up or down steps it. A read-only rating
 * is an `image` with the same value: something to read, not something to set.
 */
export function RatingStars({ className, onLayout, ...props }: RatingStarsProps): ReactElement {
	const {
		value,
		count,
		step,
		color,
		size,
		isDisabled,
		isInvalid,
		isReadOnly,
		allowClear,
		haptic,
		setValue,
		commitEnd,
	} = useRatingPart("Rating.Stars");
	const slots = ratingVariants({ isDisabled, size });
	const paint = resolveRatingPaint({ color, isInvalid });
	const fillColor = useThemeColor(paint.fill);
	const emptyColor = useThemeColor(paint.empty);
	const isInteractive = !isDisabled && !isReadOnly;

	const width = useSharedValue(0);
	const current = useSharedValue(value);
	const startValue = useSharedValue(value);
	const startX = useSharedValue(0);
	const travel = useSharedValue(0);

	// Bumped when a gesture ends, purely to re-run the sync below. A controlled
	// parent that rejects a value leaves `value` unchanged, so without the token
	// the shared value would keep the rejected one and the next tap would compare
	// against a number nobody holds.
	const [settledGestures, setSettledGestures] = useState(0);
	const settle = useCallback(() => setSettledGestures((settledCount) => settledCount + 1), []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: the token is the re-run trigger, see above
	useEffect(() => {
		current.value = value;
	}, [current, value, settledGestures]);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			width.value = event.nativeEvent.layout.width;
			onLayout?.(event);
		},
		[onLayout, width]
	);

	const gesture = useMemo(() => {
		// Beside its callers rather than at module scope, so it is captured by
		// ordinary closure — see Slider's AGENTS.md on module-scope worklets.
		const applyTouch = (x: number, isGrab: boolean) => {
			"worklet";
			const next = ratingFromOffset({ count, position: x, step, width: width.value });
			if (next <= 0) return;

			const changed = next !== current.value;
			if (changed) {
				current.value = next;
				scheduleOnRN(setValue, next);
			}
			if (haptic !== false && (isGrab || changed)) playHaptic(haptic);
		};

		return Gesture.Pan()
			.enabled(isInteractive)
			.minDistance(0)
			.shouldCancelWhenOutside(false)
			.onBegin((event) => {
				"worklet";
				startValue.value = current.value;
				startX.value = event.x;
				travel.value = 0;
				applyTouch(event.x, true);
			})
			.onUpdate((event) => {
				"worklet";
				const moved = Math.abs(event.x - startX.value);
				if (moved > travel.value) travel.value = moved;
				applyTouch(event.x, false);
			})
			.onFinalize(() => {
				"worklet";
				if (
					shouldClearRating({
						allowClear,
						startValue: startValue.value,
						touchedValue: current.value,
						travel: travel.value,
					})
				) {
					current.value = 0;
					scheduleOnRN(setValue, 0);
					if (haptic !== false) playHaptic(haptic);
				}
				scheduleOnRN(commitEnd, current.value);
				scheduleOnRN(settle);
			});
	}, [
		allowClear,
		commitEnd,
		count,
		current,
		haptic,
		isInteractive,
		setValue,
		settle,
		startValue,
		startX,
		step,
		travel,
		width,
	]);

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (!isInteractive) return;
			const direction = event.nativeEvent.actionName === "increment" ? 1 : -1;
			const next = stepRating(value, direction, step, count);
			if (next === value) return;
			setValue(next);
			commitEnd(next);
		},
		[commitEnd, count, isInteractive, setValue, step, value]
	);

	const glyphClassName = slots.glyph();
	const clipClassName = slots.clip();
	const cellClassName = slots.cell();
	const stars = Array.from({ length: count }, (_, index) => index);

	return (
		<GestureDetector gesture={gesture}>
			<View
				accessibilityActions={isReadOnly ? undefined : ACCESSIBILITY_ACTIONS}
				accessibilityLabel="Rating"
				accessibilityRole={isReadOnly ? "image" : "adjustable"}
				accessibilityState={{ disabled: isDisabled }}
				accessibilityValue={{ max: count, min: 0, now: value, text: describeRating(value, count) }}
				accessible
				className={slots.stars({ className })}
				onAccessibilityAction={handleAccessibilityAction}
				onLayout={handleLayout}
				{...props}
			>
				{stars.map((index) => (
					<View className={cellClassName} key={index}>
						<RatingStar
							clipClassName={clipClassName}
							emptyColor={emptyColor}
							fill={starFillOf(index, value)}
							fillColor={fillColor}
							glyphClassName={glyphClassName}
						/>
					</View>
				))}
			</View>
		</GestureDetector>
	);
}
RatingStars.displayName = "DelacourUI.Rating.Stars";

/**
 * The two actions an assistive swipe on an `adjustable` maps to.
 *
 * Module scope on purpose: a fresh array each render is a new prop every commit.
 */
const ACCESSIBILITY_ACTIONS = [{ name: "increment" }, { name: "decrement" }] as const;
