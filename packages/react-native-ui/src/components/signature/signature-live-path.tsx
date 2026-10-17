import type { ReactElement } from "react";
import { StyleSheet } from "react-native";
import Animated, { type SharedValue, useAnimatedProps } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { smoothStroke } from "./signature.stroke";
import type { SignaturePoint } from "./signature.types";

/** Created once at module scope: per render it would mint a new component type and remount the path. */
const AnimatedPath = Animated.createAnimatedComponent(Path);

export type SignatureLivePathProps = {
	/** The stroke under the finger, written by the pad's gesture on the UI thread. */
	points: SharedValue<SignaturePoint[]>;
	color: string | undefined;
	strokeWidth: number;
};

/**
 * The stroke being drawn, rebuilt on the UI thread on every move.
 *
 * Internal. Its `d` is an animated prop computed by the same `smoothStroke` the
 * finished paths use, so React never renders while a finger moves and the
 * stroke does not shift by a hair when it is committed.
 */
export function SignatureLivePath({ points, color, strokeWidth }: SignatureLivePathProps): ReactElement {
	const animatedProps = useAnimatedProps(() => ({ d: smoothStroke(points.value) }));

	return (
		<Svg height="100%" pointerEvents="none" style={StyleSheet.absoluteFill} width="100%">
			<AnimatedPath
				animatedProps={animatedProps}
				fill="none"
				stroke={color}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={strokeWidth}
			/>
		</Svg>
	);
}
SignatureLivePath.displayName = "DelacourUI.Signature.LivePath";
