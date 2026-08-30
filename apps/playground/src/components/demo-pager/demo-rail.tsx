import type { ScreenScrollViewRef } from "@delacour/native-ui/screen";
import type { ReactElement } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	type AnimatedRef,
	type DerivedValue,
	interpolate,
	scrollTo,
	useAnimatedStyle,
} from "react-native-reanimated";

/** The rail's ceiling. Chrome, not content — it may not grow with the demo count. */
const RAIL_HEIGHT = 72;
/**
 * The pitch floor, and it is set by the gap rather than by the tick.
 *
 * A resting tick is one point tall, so four points of pitch leaves three points
 * of air between ticks — about the 1:3 the eye needs to read a stack of lines
 * as separate marks. At three points of pitch the rail closes up into a solid
 * bar and stops being a position indicator at all.
 */
const MIN_PITCH = 4;
const MAX_PITCH = 8;

/** Padding around the rail's own width, so a thumb has something to catch. */
const HIT_SLOP = { bottom: 10, left: 16, right: 24, top: 10 } as const;

const TICK_WIDTH = { active: 18, rest: 8 } as const;
const TICK_HEIGHT = { active: 2, rest: 1 } as const;
const TICK_OPACITY = { active: 1, rest: 0.3 } as const;

export type DemoRailProps = {
	/** One tick per demo, keyed by the demo's own id. */
	ids: readonly string[];
	/** Position in pages, continuous. */
	progress: DerivedValue<number>;
	/** The scroll view to drive while the rail is scrubbed. */
	scrollRef: AnimatedRef<ScreenScrollViewRef>;
	/** One page's height, for turning a rail position into a scroll offset. */
	pageHeight: number;
};

/**
 * Where you are in the set, and the fastest way to somewhere else.
 *
 * The pitch closes up rather than the rail growing, because this is chrome: a
 * rail that tracked its demo count would be three ticks tall on Tabs and two
 * hundred points tall on Button, and the band it sits in would move with it.
 * Eighteen demos — Button, the worst case in the library — land at the 3pt
 * floor and still fit the ceiling above.
 *
 * That floor is also why a tick is not a tap target and the scrub is
 * positional rather than per-tick: three points cannot be hit on purpose, so
 * the rail answers "roughly here" and `DemoIndexSheet` answers "that one".
 *
 * Every tick reads the same continuous scroll position rather than a settled
 * index, so the rail moves with the finger instead of stepping after it. That
 * is the whole reason it is worth having over a row of dots.
 */
export function DemoRail({ ids, progress, scrollRef, pageHeight }: DemoRailProps): ReactElement {
	const pitch = Math.min(Math.max(RAIL_HEIGHT / ids.length, MIN_PITCH), MAX_PITCH);
	const railHeight = pitch * ids.length;
	const lastIndex = ids.length - 1;

	// `minDistance(0)` so a tap and a drag are the same gesture: the rail sits in
	// the footer, outside the pager's scroll view, so there is nothing here for
	// an immediately-activating pan to steal from.
	//
	// The touch area is hit slop rather than a wider box, so the rail occupies
	// only the width it draws. A 44pt-wide box would hold the label 26pt off the
	// ticks and read as a gap nobody chose.
	const scrub = Gesture.Pan()
		.minDistance(0)
		.hitSlop(HIT_SLOP)
		.onBegin((event) => scrubTo(event.y))
		.onUpdate((event) => scrubTo(event.y));

	function scrubTo(y: number): void {
		"worklet";
		if (lastIndex <= 0 || pageHeight <= 0) return;
		const ratio = Math.min(Math.max(y / railHeight, 0), 1);
		scrollTo(scrollRef, 0, ratio * lastIndex * pageHeight, false);
	}

	return (
		<GestureDetector gesture={scrub}>
			<View
				accessibilityElementsHidden
				className="items-start justify-center"
				importantForAccessibility="no-hide-descendants"
				style={{ height: railHeight, width: TICK_WIDTH.active }}
			>
				{ids.map((id, index) => (
					<DemoRailTick index={index} key={id} pitch={pitch} progress={progress} />
				))}
			</View>
		</GestureDetector>
	);
}

/**
 * One tick, widening and brightening as the pager settles onto its demo.
 *
 * Interpolated over a single page of travel in either direction, so exactly one
 * tick is ever at full width and the two beside it carry the movement.
 */
function DemoRailTick({
	index,
	pitch,
	progress,
}: {
	index: number;
	pitch: number;
	progress: DerivedValue<number>;
}): ReactElement {
	const style = useAnimatedStyle(() => {
		const distance = Math.abs(progress.value - index);

		return {
			height: interpolate(distance, [0, 1], [TICK_HEIGHT.active, TICK_HEIGHT.rest], "clamp"),
			opacity: interpolate(distance, [0, 1], [TICK_OPACITY.active, TICK_OPACITY.rest], "clamp"),
			width: interpolate(distance, [0, 1], [TICK_WIDTH.active, TICK_WIDTH.rest], "clamp"),
		};
	});

	return (
		<View className="justify-center" style={{ height: pitch }}>
			<Animated.View className="rounded-full bg-foreground" style={style} />
		</View>
	);
}
