import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { type DerivedValue, interpolate, useAnimatedStyle } from "react-native-reanimated";

/** The bar's own height. It is the header's separator as well as its indicator. */
const TRACK_HEIGHT = 2;
const SEGMENT_GAP = 2;
const SEGMENT_OPACITY = { active: 1, rest: 0.22 } as const;

export type DemoRailProps = {
	/** One segment per demo, keyed by the demo's own id. */
	ids: readonly string[];
	/** Position in pages, continuous. */
	progress: DerivedValue<number>;
};

/**
 * Where you are in the set, drawn as the header's own bottom edge.
 *
 * A sticky header needs a separator to hold it off the content, and a gallery
 * needs a position indicator; this is one mark doing both jobs. Full-bleed
 * rather than inset for that reason — a rule that stops short of the screen
 * edge reads as a widget sitting in the header, not as the edge of it.
 *
 * **It reports, it does not steer.** The rail takes no gesture of its own:
 * moving between demos is the pager's swipe, and picking one out by name is the
 * index sheet's job. A two-point rule is a poor target however wide its
 * segments are, and giving it a second way to do what the sheet already does
 * well bought an ambiguity rather than a shortcut.
 *
 * Horizontal is still what makes it legible. Stacked vertically, eighteen demos
 * put three points between ticks and the rail closed up into a solid bar; laid
 * across the width the same eighteen are about twenty points each and read as
 * separate marks.
 *
 * Every segment reads the same continuous scroll position rather than a settled
 * index, so the rail moves with the finger instead of stepping after it.
 */
export function DemoRail({ ids, progress }: DemoRailProps): ReactElement {
	return (
		<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			<View className="flex-row" style={{ gap: SEGMENT_GAP, height: TRACK_HEIGHT }}>
				{ids.map((id, index) => (
					<DemoRailSegment index={index} key={id} progress={progress} />
				))}
			</View>
		</View>
	);
}

/**
 * One segment, brightening as the pager settles onto its demo.
 *
 * Interpolated over a single page of travel either side, so exactly one segment
 * is ever at full strength and the two beside it carry the movement. Opacity
 * rather than two colour tokens: the resting mark has to read as the same rule
 * as the active one, dimmer, not as a second colour.
 */
function DemoRailSegment({ index, progress }: { index: number; progress: DerivedValue<number> }): ReactElement {
	const style = useAnimatedStyle(() => ({
		opacity: interpolate(
			Math.abs(progress.value - index),
			[0, 1],
			[SEGMENT_OPACITY.active, SEGMENT_OPACITY.rest],
			"clamp"
		),
	}));

	return <Animated.View className="h-full flex-1 rounded-full bg-foreground" style={style} />;
}
