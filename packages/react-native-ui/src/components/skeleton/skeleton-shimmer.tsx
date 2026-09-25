import { type ReactElement, useId } from "react";
import { StyleSheet } from "react-native";
import Animated, {
	type AnimatedRef,
	measure,
	type SharedValue,
	useAnimatedRef,
	useAnimatedStyle,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { SKELETON_SHIMMER_STOPS, skeletonShimmerOffset, skeletonVariants } from "./skeleton.variants";

/** The token the band is painted in — a surface that rises above the placeholder fill in both themes. */
const SHIMMER_TOKEN = "elevated";

/**
 * The glint that sweeps across a loading skeleton.
 *
 * A band as tall as the skeleton and 60% as wide — bounded to 48–240pt by its
 * class — carried from off one edge to off the other by the clock. The root clips
 * it, so a circle's glint stays inside the circle.
 *
 * Painted in `elevated` rather than white or a translucent black. That token is
 * the raised surface in both themes — white in light, a lifted grey in dark —
 * so it lands above the skeleton's tinted fill either way, reads as a
 * highlight, and follows a pasted palette with no support from here.
 *
 * Everything runs on the UI thread, so a skeleton never re-renders to animate.
 */
export function SkeletonShimmer({
	progress,
	container,
}: {
	progress: SharedValue<number>;
	container: AnimatedRef<Animated.View>;
}): ReactElement {
	const color = useThemeColor(SHIMMER_TOKEN);
	const band = useAnimatedRef<Animated.View>();

	// Gradient ids are global to the document, and React 19's `«r1»`-style ids
	// carry delimiters that are invalid inside `url(#…)`.
	const id = `skeleton-shimmer-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

	// Both widths are measured on the UI thread, so the sweep always uses the
	// layout as it is now and nothing round-trips through JavaScript. Only
	// `transform` and `opacity` are written, so every frame takes Reanimated's
	// fast path and never commits layout; Yoga sizes the band from its class.
	const motionStyle = useAnimatedStyle(() => {
		const outer = measure(container);
		const inner = measure(band);
		if (!outer || !inner) return { opacity: 0, transform: [{ translateX: 0 }] };

		return {
			opacity: 1,
			transform: [{ translateX: skeletonShimmerOffset(progress.value, outer.width, inner.width) }],
		};
	});

	// The gradient is drawn in a unit viewBox stretched over an absolutely
	// filled Svg, never at `width="100%"`. On the simulator a percentage-sized
	// Svg kept its first size when the band resized — the last line of a
	// paragraph becoming a full one — so its bright centre sat off the band's
	// centre and the line glinted out of step with its neighbours.
	return (
		<Animated.View className={skeletonVariants().band()} pointerEvents="none" ref={band} style={motionStyle}>
			<Svg preserveAspectRatio="none" style={StyleSheet.absoluteFill} viewBox="0 0 1 1">
				<Defs>
					<LinearGradient id={id} x1="0" x2="1" y1="0" y2="0">
						{SKELETON_SHIMMER_STOPS.map((stop) => (
							<Stop key={stop.offset} offset={stop.offset} stopColor={color} stopOpacity={stop.opacity} />
						))}
					</LinearGradient>
				</Defs>
				<Rect fill={`url(#${id})`} height={1} width={1} x={0} y={0} />
			</Svg>
		</Animated.View>
	);
}
SkeletonShimmer.displayName = "DelacourUI.Skeleton.Shimmer";
