import { type ReactElement, useEffect } from "react";
import { useAnimatedStyle } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { Text, type TextProps } from "../text";
import { useMarkerPart, useMarkerShimmerRegistry } from "./marker.context";
import { markerShimmerOpacity, markerVariants, resolveMarkerShimmer } from "./marker.variants";
import { useMarkerShimmerClock } from "./marker-shimmer-clock";

export type MarkerContentProps = TextProps & {
	/**
	 * A sweep across the text while the step runs. Drop it the moment the step
	 * ends — a marker that shimmers forever reads as a stuck one.
	 */
	shimmer?: boolean;
};

/**
 * The marker's text: muted, extra-small, centred.
 *
 * Carries its own colour (package rule 1) — the root is a `View`, which does not
 * cascade colour to a `Text`.
 *
 * `shimmer` breathes the text's opacity on the UI thread while the step runs,
 * and tells the root, which announces itself busy. Calm motion stills the
 * breath but not the announcement: the step is running either way.
 */
export function MarkerContent({ shimmer = false, className, style, ...props }: MarkerContentProps): ReactElement {
	const { variant } = useMarkerPart("Marker.Content");
	const registerShimmer = useMarkerShimmerRegistry();
	const isCalm = useCalmMotion();
	const { progress, blend } = useMarkerShimmerClock(resolveMarkerShimmer({ shimmer, isCalm }));

	useEffect(() => {
		if (!shimmer || !registerShimmer) return;
		return registerShimmer();
	}, [shimmer, registerShimmer]);

	const shimmerStyle = useAnimatedStyle(() => ({
		opacity: 1 - blend.value * (1 - markerShimmerOpacity(progress.value)),
	}));

	return (
		<Text className={markerVariants({ variant }).content({ className })} style={[style, shimmerStyle]} {...props} />
	);
}
MarkerContent.displayName = "DelacourUI.Marker.Content";
