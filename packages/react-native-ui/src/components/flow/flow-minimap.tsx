import { type ReactElement, useMemo } from "react";
import Animated, { type SharedValue, useAnimatedProps, useDerivedValue } from "react-native-reanimated";
import Svg, { Rect } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { Surface } from "../surface";
import { useFlowPart } from "./flow.context";
import { FLOW_DEFAULTS, type FlowMiniMapCorner, flowVariants } from "./flow.variants";
import { type FlowPoint, type FlowSize, flowGeometry } from "./flow-geometry";
import { AnimatedMatrixG, type FlowMatrixGProps } from "./flow-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export type FlowMiniMapProps = {
	/** Which corner of the canvas it floats in. */
	corner?: FlowMiniMapCorner;
	width?: number;
	height?: number;
	/** A theme token or a literal for the node blocks. Defaults to `muted-foreground`. */
	nodeColor?: string;
	className?: string;
};

type MiniMapShape = { id: string; isGroup: boolean; position: SharedValue<FlowPoint>; size: SharedValue<FlowSize> };

/** One node or group, as a block that follows its drag. */
function FlowMiniMapBlock({ shape, fill }: { shape: MiniMapShape; fill: string | undefined }): ReactElement {
	const { position, size } = shape;
	const props = useAnimatedProps(() => ({
		height: size.value.height,
		width: size.value.width,
		x: position.value.x,
		y: position.value.y,
	}));
	return <AnimatedRect animatedProps={props} fill={fill} fillOpacity={shape.isGroup ? 0.25 : 0.6} rx={4} />;
}
FlowMiniMapBlock.displayName = "DelacourUI.Flow.MiniMap.Block";

/**
 * The whole graph in a corner, with a frame around the part on screen.
 *
 * **Its bounds hold the visible area as well as the nodes**, so the frame never slides off the
 * map when the canvas is panned past the graph. Every block, the frame and the fit are worklets
 * over the same shared values the canvas draws from, so a drag moves the block on the same frame.
 *
 * Read-only and hidden from assistive technology: it is a picture of the canvas, and touches pass
 * through it to the canvas beneath.
 */
export function FlowMiniMap({
	corner = "bottom-right",
	width = FLOW_DEFAULTS.miniMapWidth,
	height = FLOW_DEFAULTS.miniMapHeight,
	nodeColor,
	className,
}: FlowMiniMapProps): ReactElement {
	const { entries, viewport, container } = useFlowPart("Flow.MiniMap");
	const slots = flowVariants({ miniMapCorner: corner });
	const nodeFill = useThemeColor(nodeColor ?? "muted-foreground");
	const frameStroke = useThemeColor("primary");

	const shapes = useMemo<MiniMapShape[]>(
		() =>
			entries.map((candidate) => ({
				id: candidate.id,
				isGroup: candidate.kind === "group",
				position: candidate.entry.position,
				size: candidate.entry.size,
			})),
		[entries]
	);

	const fit = useDerivedValue(() => {
		const geometry = flowGeometry();
		const visible = geometry.visibleGraphRect(viewport.value, container.value);
		const rects = [visible];
		for (const shape of shapes) {
			const rect = { ...shape.position.value, ...shape.size.value };
			if (rect.width > 0 || rect.height > 0) rects.push(rect);
		}
		const bounds = geometry.unionRects(rects) ?? visible;
		return { transform: geometry.miniMapTransform(bounds, width, height, FLOW_DEFAULTS.miniMapPadding), visible };
	});

	const groupProps = useAnimatedProps<FlowMatrixGProps>(() => {
		const { scale, x, y } = fit.value.transform;
		return { matrix: [scale, 0, 0, scale, x, y] };
	});

	const frameProps = useAnimatedProps(() => {
		const { visible, transform } = fit.value;
		return {
			height: visible.height,
			strokeWidth: 1.5 / transform.scale,
			width: visible.width,
			x: visible.x,
			y: visible.y,
		};
	});

	return (
		<Surface
			accessibilityElementsHidden
			className={slots.miniMap({ className })}
			importantForAccessibility="no-hide-descendants"
			padding="none"
			pointerEvents="none"
			style={{ height, width }}
		>
			<Svg height={height} width={width}>
				<AnimatedMatrixG animatedProps={groupProps}>
					{shapes.map((shape) => (
						<FlowMiniMapBlock fill={nodeFill} key={shape.id} shape={shape} />
					))}
					<AnimatedRect animatedProps={frameProps} fill="none" stroke={frameStroke} />
				</AnimatedMatrixG>
			</Svg>
		</Surface>
	);
}
FlowMiniMap.displayName = "DelacourUI.Flow.MiniMap";
