import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { Canvas, DashPathEffect, Group, Path, Skia } from "react-native-skia";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useFlowPart } from "./flow.context";
import { FLOW_DEFAULTS } from "./flow.variants";
import { flowGeometry } from "./flow-geometry";

/** The side a preview arrives on — the one facing back at the handle it left. */
const OPPOSITE = { bottom: "top", left: "right", right: "left", top: "bottom" } as const;

const PREVIEW_DASH = [6, 4];

/**
 * The line from a handle to the finger while a connection is dragged — internal.
 *
 * **Its own canvas, above the nodes.** The edges' canvas sits beneath the nodes, which is right for
 * an edge and wrong for a line the finger is drawing: it would vanish behind the very card it is
 * being dragged onto. Nothing here takes a touch. Its colour is resolved out here, above the
 * canvas, where the app's theme is still in reach.
 */
export function FlowConnectionPreview(): ReactElement {
	const { viewport, preview } = useFlowPart("Flow.ConnectionPreview");
	const stroke = useThemeColor("primary") ?? "transparent";

	const transform = useDerivedValue(() => {
		const { x, y, zoom } = viewport.value;
		return [{ translateX: x }, { translateY: y }, { scale: zoom }];
	});

	const path = useDerivedValue(() => {
		const { from, fromSide, to } = preview.value;
		const d = flowGeometry().routeBezier(from, fromSide, to, OPPOSITE[fromSide], FLOW_DEFAULTS.edgeCurvature);
		return Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
	});
	const opacity = useDerivedValue(() => (preview.value.isActive ? 1 : 0));

	return (
		<View pointerEvents="none" style={StyleSheet.absoluteFill}>
			<Canvas style={StyleSheet.absoluteFill}>
				<Group transform={transform}>
					<Path
						color={stroke}
						opacity={opacity}
						path={path}
						strokeCap="round"
						strokeWidth={FLOW_DEFAULTS.edgeWidth}
						style="stroke"
					>
						<DashPathEffect intervals={PREVIEW_DASH} />
					</Path>
				</Group>
			</Canvas>
		</View>
	);
}
FlowConnectionPreview.displayName = "DelacourUI.Flow.ConnectionPreview";
