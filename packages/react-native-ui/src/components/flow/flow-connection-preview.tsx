import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useFlowPart } from "./flow.context";
import { FLOW_DEFAULTS } from "./flow.variants";
import { flowGeometry } from "./flow-geometry";
import { AnimatedMatrixG, type FlowMatrixGProps } from "./flow-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The side a preview arrives on — the one facing back at the handle it left. */
const OPPOSITE = { bottom: "top", left: "right", right: "left", top: "bottom" } as const;

/**
 * The line from a handle to the finger while a connection is dragged — internal.
 *
 * **Its own SVG, above the nodes.** The edges' layer sits beneath the nodes, which is right for an
 * edge and wrong for a line the finger is drawing: it would vanish behind the very card it is
 * being dragged onto. Nothing here takes a touch.
 */
export function FlowConnectionPreview(): ReactElement {
	const { viewport, preview } = useFlowPart("Flow.ConnectionPreview");
	const stroke = useThemeColor("primary");

	const groupProps = useAnimatedProps<FlowMatrixGProps>(() => {
		const { x, y, zoom } = viewport.value;
		return { matrix: [zoom, 0, 0, zoom, x, y] };
	});

	const lineProps = useAnimatedProps(() => {
		const { isActive, from, fromSide, to } = preview.value;
		const d = flowGeometry().routeBezier(from, fromSide, to, OPPOSITE[fromSide], FLOW_DEFAULTS.edgeCurvature);
		return { d, opacity: isActive ? 1 : 0 };
	});

	return (
		<View className="absolute inset-0" pointerEvents="none">
			<Svg height="100%" width="100%">
				<AnimatedMatrixG animatedProps={groupProps}>
					<AnimatedPath
						animatedProps={lineProps}
						fill="none"
						stroke={stroke}
						strokeDasharray={[6, 4]}
						strokeLinecap="round"
						strokeWidth={FLOW_DEFAULTS.edgeWidth}
					/>
				</AnimatedMatrixG>
			</Svg>
		</View>
	);
}
FlowConnectionPreview.displayName = "DelacourUI.Flow.ConnectionPreview";
