import type { ReactElement } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Pressable } from "../pressable";
import { resolveScrimRects, type TourSize, tourVariants } from "./tour.variants";
import type { TourHoleValues } from "./tour-mask";

type TourScrimProps = {
	size: TourSize;
	hole: TourHoleValues;
	/** Let touches inside the hole reach the control beneath. */
	isInteractive: boolean;
	/** What a tap on the dim does — skip when dismissible, nothing otherwise. */
	onPress?: () => void;
};

/** The four sides of the scrim, in `resolveScrimRects` order. */
const SIDES = [0, 1, 2, 3] as const;

/**
 * What a touch on the dim meets.
 *
 * Not interactive, it is one full-window `Pressable`: the hole is drawn but every touch is
 * swallowed, so nothing beneath can be pressed by mistake. Interactive, it is four `Pressable`s
 * tiling the window around the hole and following it on the UI thread, so a touch inside the
 * hole meets nothing and falls through to the app.
 *
 * Hidden from assistive technology either way: the card's actions are the accessible way out.
 */
export function TourScrim({ size, hole, isInteractive, onPress }: TourScrimProps): ReactElement {
	if (!isInteractive) {
		return (
			<Pressable
				accessibilityElementsHidden
				accessible={false}
				className={tourVariants().scrim()}
				feedback="none"
				importantForAccessibility="no-hide-descendants"
				onPress={onPress}
			/>
		);
	}

	return (
		<>
			{SIDES.map((side) => (
				<TourScrimSide hole={hole} key={side} onPress={onPress} side={side} size={size} />
			))}
		</>
	);
}
TourScrim.displayName = "DelacourUI.Tour.Scrim";

/** One rectangle of an interactive scrim, positioned on the UI thread. */
function TourScrimSide({
	size,
	hole,
	side,
	onPress,
}: {
	size: TourSize;
	hole: TourHoleValues;
	side: (typeof SIDES)[number];
	onPress?: () => void;
}): ReactElement {
	const { width, height } = size;

	const style = useAnimatedStyle(() => {
		const rect = resolveScrimRects(
			{ width, height },
			{ x: hole.x.value, y: hole.y.value, width: hole.width.value, height: hole.height.value }
		)[side];
		return { position: "absolute", left: rect.x, top: rect.y, width: rect.width, height: rect.height };
	});

	return (
		<Animated.View style={style}>
			<Pressable
				accessibilityElementsHidden
				accessible={false}
				className="flex-1"
				feedback="none"
				importantForAccessibility="no-hide-descendants"
				onPress={onPress}
			/>
		</Animated.View>
	);
}
TourScrimSide.displayName = "DelacourUI.Tour.Scrim.Side";
