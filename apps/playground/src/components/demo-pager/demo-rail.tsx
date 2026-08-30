import type { ScreenScrollViewRef } from "@delacour/native-ui/screen";
import { type ReactElement, useCallback, useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	type AnimatedRef,
	type DerivedValue,
	interpolate,
	scrollTo,
	useAnimatedStyle,
} from "react-native-reanimated";

/** The bar's own height. It is the header's separator as well as its indicator. */
const TRACK_HEIGHT = 2;
/** Transparent height around the bar, so a 2pt mark is still a real target. */
const TOUCH_HEIGHT = 18;
const HIT_SLOP = { bottom: 8, left: 0, right: 0, top: 10 } as const;

const SEGMENT_GAP = 2;
const SEGMENT_OPACITY = { active: 1, rest: 0.22 } as const;

export type DemoRailProps = {
	/** One segment per demo, keyed by the demo's own id. */
	ids: readonly string[];
	/** Position in pages, continuous. */
	progress: DerivedValue<number>;
	/** The scroll view this rail drives. */
	scrollRef: AnimatedRef<ScreenScrollViewRef>;
	/** One page's height, for turning a rail position into a scroll offset. */
	pageHeight: number;
};

/**
 * Where you are in the set, drawn as the header's own bottom edge.
 *
 * A sticky header needs a separator to hold it off the content, and a gallery
 * needs a position indicator; this is one mark doing both jobs. Full-bleed
 * rather than inset for that reason — a rule that stops short of the screen
 * edge reads as a widget sitting in the header, not as the edge of it.
 *
 * **Horizontal is what makes it selectable.** Stacked vertically, eighteen
 * demos put three points between ticks and nothing can be hit on purpose. Laid
 * across the width, the same eighteen are about twenty points each, which is a
 * real target — so the rail can own jumping, and the floating button that used
 * to own it is gone.
 *
 * Every segment reads the same continuous scroll position rather than a settled
 * index, so the rail moves with the finger instead of stepping after it.
 */
export function DemoRail({ ids, progress, scrollRef, pageHeight }: DemoRailProps): ReactElement {
	const [width, setWidth] = useState(0);
	const lastIndex = ids.length - 1;

	const onLayout = useCallback((event: LayoutChangeEvent) => {
		const measured = event.nativeEvent.layout.width;
		setWidth((current) => (Math.abs(current - measured) < 1 ? current : measured));
	}, []);

	/** Live position under the finger, in scroll offset. */
	function offsetAt(x: number): number {
		"worklet";
		const ratio = Math.min(Math.max(x / width, 0), 1);
		return ratio * lastIndex * pageHeight;
	}

	const isDrivable = lastIndex > 0 && pageHeight > 0 && width > 0;

	// `minDistance(0)` makes a tap and a drag the same gesture. The rail lives in
	// the header, outside the pager's scroll view, so an immediately-activating
	// pan has nothing here to steal from.
	//
	// The settle on release is not optional. `pagingEnabled` only snaps at the
	// end of a *user* gesture on the scroll view itself, so a programmatic scroll
	// to an arbitrary offset would strand the pager between two demos — which is
	// exactly what a positional scrub produces on every frame.
	const scrub = Gesture.Pan()
		.enabled(isDrivable)
		.minDistance(0)
		.hitSlop(HIT_SLOP)
		.onBegin((event) => {
			"worklet";
			scrollTo(scrollRef, 0, offsetAt(event.x), false);
		})
		.onUpdate((event) => {
			"worklet";
			scrollTo(scrollRef, 0, offsetAt(event.x), false);
		})
		.onEnd((event) => {
			"worklet";
			const index = Math.round(offsetAt(event.x) / pageHeight);
			scrollTo(scrollRef, 0, Math.min(Math.max(index, 0), lastIndex) * pageHeight, true);
		});

	return (
		<GestureDetector gesture={scrub}>
			<View
				accessibilityElementsHidden
				className="justify-end"
				importantForAccessibility="no-hide-descendants"
				onLayout={onLayout}
				style={{ height: TOUCH_HEIGHT }}
			>
				<View className="flex-row" style={{ gap: SEGMENT_GAP, height: TRACK_HEIGHT }}>
					{ids.map((id, index) => (
						<DemoRailSegment index={index} key={id} progress={progress} />
					))}
				</View>
			</View>
		</GestureDetector>
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
