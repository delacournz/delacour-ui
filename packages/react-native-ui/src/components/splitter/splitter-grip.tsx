import type { ReactElement } from "react";
import Animated, { type SharedValue, useAnimatedStyle, useDerivedValue, withSpring } from "react-native-reanimated";
import { SPLITTER_GRIP_ACTIVE_SCALE, SPLITTER_GRIP_SPRING, type SplitterOrientation } from "./splitter.variants";

type SplitterGripProps = {
	/** Written by the handle's pan on touch-down and release. */
	isHeld: SharedValue<boolean>;
	orientation: SplitterOrientation;
	className: string;
};

/**
 * The capsule drawn in the middle of a handle.
 *
 * It grows **across** the seam while held, never along it: along the seam it is
 * already as long as it needs to be, and growing there would read as the handle
 * moving. The scale is derived from the held flag rather than computed inside the
 * style, so the spring is evaluated when the grab changes and not on every frame
 * of the drag. The colour change is a class, set by the handle from the same
 * moment on the JS thread.
 */
export function SplitterGrip({ isHeld, orientation, className }: SplitterGripProps): ReactElement {
	const scale = useDerivedValue(() => withSpring(isHeld.value ? SPLITTER_GRIP_ACTIVE_SCALE : 1, SPLITTER_GRIP_SPRING));
	const style = useAnimatedStyle(() =>
		orientation === "horizontal" ? { transform: [{ scaleX: scale.value }] } : { transform: [{ scaleY: scale.value }] }
	);

	return <Animated.View className={className} pointerEvents="none" style={style} />;
}
SplitterGrip.displayName = "DelacourUI.Splitter.Grip";
