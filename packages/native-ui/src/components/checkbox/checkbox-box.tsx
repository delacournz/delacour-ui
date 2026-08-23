import { type ReactElement, useCallback, useEffect } from "react";
import type { LayoutChangeEvent } from "react-native";
import Animated, {
	cancelAnimation,
	Extrapolation,
	interpolate,
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useThemeColor } from "../../hooks/use-theme-color";
import { IconCheckmark1Small, IconMinusSmall } from "../../icons/central";
import { Icon } from "../icon";
import { useCheckboxPart } from "./checkbox.context";
import {
	CHECKBOX_FILL_RADIUS,
	CHECKBOX_GLYPH_TOKEN,
	CHECKBOX_INDICATOR_ANIMATION,
	CHECKBOX_INVALID_GLYPH_TOKEN,
	checkboxVariants,
	resolveCheckboxBorderTokens,
	resolveCheckboxFilled,
} from "./checkbox.variants";

/**
 * The square itself: its border, the fill behind it and the tick drawn on top.
 *
 * Internal — the checkbox renders one and there is nothing for a caller to
 * compose here that `isIndeterminate` does not already decide. It takes a file
 * of its own because it owns every animated value; keeping them in the root
 * would make the root a component that changes for two unrelated reasons.
 *
 * Three things move, off one shared progress, so they cannot drift out of step:
 *
 * - the **fill** fades and scales from the centre. A box is filled, not slid
 *   into, so it arrives from no edge. Its corner radius is fixed rather than
 *   animated — {@link CHECKBOX_FILL_RADIUS} keeps it concentric with the border
 *   at every scale, and the transform shrinks the rendered corner with it.
 * - the **tick** is clipped by a container whose width opens from the left, so
 *   the stroke is drawn on when ticking and taken back when unticking rather
 *   than faded up in place.
 * - the **border** interpolates from the field chrome to the fill's own colour,
 *   held back by `borderDelay` until the surface is near the edge — so it reads
 *   as the fill arriving at the border rather than as an outline changing on its
 *   own. A colour being interpolated cannot be a class, which is why this one is
 *   the only part of the box a `tv()` does not describe.
 *
 * The clip needs the box's width in points, and a `size-checkbox-*` class cannot
 * be read from JavaScript. It comes from the fill's own `onLayout` rather than a
 * table of numbers restating `tokens.css` — that layer is already exactly the
 * size the clip has to span.
 *
 * Reduce-motion takes Reanimated's default `System` policy here, deliberately
 * unlike `Spinner`. Under it `withTiming` completes instantly, which for a
 * checkbox is exactly right: the state change is the point and the travel is
 * decoration. A spinner had to opt out because its animation *is* the signal.
 */
export function CheckboxBox(): ReactElement {
	const { color, size, isChecked, isIndeterminate, isInvalid } = useCheckboxPart("Checkbox.Box");
	const isFilled = resolveCheckboxFilled({ isChecked, isIndeterminate });

	const progress = useSharedValue(isFilled ? 1 : 0);
	const boxWidth = useSharedValue(0);

	useEffect(() => {
		progress.value = withTiming(isFilled ? 1 : 0, { duration: CHECKBOX_INDICATOR_ANIMATION.durationMs });

		// Without this a box unmounted mid-toggle leaves its timing running.
		return () => cancelAnimation(progress);
	}, [isFilled, progress]);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			boxWidth.value = event.nativeEvent.layout.width;
		},
		[boxWidth]
	);

	const border = resolveCheckboxBorderTokens({ color, isInvalid });
	const restBorderColor = useThemeColor(border.rest) ?? "transparent";
	const activeBorderColor = useThemeColor(border.active) ?? "transparent";

	const boxStyle = useAnimatedStyle(() => ({
		borderColor: interpolateColor(
			interpolate(progress.value, [CHECKBOX_INDICATOR_ANIMATION.borderDelay, 1], [0, 1], Extrapolation.CLAMP),
			[0, 1],
			[restBorderColor, activeBorderColor]
		),
	}));

	const fillStyle = useAnimatedStyle(() => ({
		opacity: interpolate(progress.value, [0, 1], CHECKBOX_INDICATOR_ANIMATION.opacity),
		transform: [{ scale: interpolate(progress.value, [0, 1], CHECKBOX_INDICATOR_ANIMATION.scale) }],
	}));

	// Clamped, so the tick sits at zero width through the delay rather than being
	// extrapolated to a negative one.
	const tickStyle = useAnimatedStyle(() => ({
		width:
			boxWidth.value *
			interpolate(progress.value, [CHECKBOX_INDICATOR_ANIMATION.tickDelay, 1], [0, 1], Extrapolation.CLAMP),
	}));

	// Full width regardless of the clip in front of it, so the glyph stays on the
	// box's centre line while the clip opens instead of sliding across with it.
	const tickInnerStyle = useAnimatedStyle(() => ({ width: boxWidth.value }));

	const slots = checkboxVariants({ color, isFilled, isInvalid, size });
	// A colour that has to reach an SVG paint prop cannot be a class. See Theming.
	const glyphColor = useThemeColor(isInvalid ? CHECKBOX_INVALID_GLYPH_TOKEN : CHECKBOX_GLYPH_TOKEN[color]);

	return (
		<Animated.View className={slots.box()} style={boxStyle}>
			<Animated.View
				className={slots.indicator()}
				onLayout={handleLayout}
				// A fixed radius rather than an animated one: the fill has to stay
				// concentric with the border at every scale, and the value that
				// achieves that never changes. `scale` shrinks the rendered corner
				// along with the square, which is what keeps a half-grown fill
				// looking like a smaller version of the finished one.
				style={[{ borderRadius: CHECKBOX_FILL_RADIUS[size] }, fillStyle]}
			/>
			<Animated.View className={slots.tick()} style={tickStyle}>
				<Animated.View className={slots.tickInner()} style={tickInnerStyle}>
					<Icon
						className={slots.glyph()}
						color={glyphColor}
						icon={isIndeterminate ? IconMinusSmall : IconCheckmark1Small}
					/>
				</Animated.View>
			</Animated.View>
		</Animated.View>
	);
}
CheckboxBox.displayName = "DelacourUI.Checkbox.Box";
