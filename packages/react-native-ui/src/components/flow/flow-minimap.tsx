import { type ReactElement, useMemo } from "react";
import { type SharedValue, useDerivedValue } from "react-native-reanimated";
import { Canvas, Group, Rect, RoundedRect, Skia } from "react-native-skia";
import { useThemeColor } from "../../hooks/use-theme-color";
import { Surface } from "../surface";
import { useFlowPart } from "./flow.context";
import { FLOW_DEFAULTS, type FlowMiniMapCorner, flowVariants } from "./flow.variants";
import { type FlowPoint, type FlowSize, flowGeometry } from "./flow-geometry";

/** A block's corner, in graph units. */
const BLOCK_RADIUS = 4;

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

/**
 * One node or group, as a block that follows its drag. Drawn inside the minimap's canvas, so its
 * colour arrives as a plain value — no theme hook can reach the app from in there.
 */
function FlowMiniMapBlock({ shape, fill }: { shape: MiniMapShape; fill: string }): ReactElement {
	const { position, size } = shape;
	const rect = useDerivedValue(() =>
		Skia.RRectXY(
			Skia.XYWHRect(position.value.x, position.value.y, size.value.width, size.value.height),
			BLOCK_RADIUS,
			BLOCK_RADIUS
		)
	);
	return <RoundedRect color={fill} opacity={shape.isGroup ? 0.25 : 0.6} rect={rect} />;
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
	const nodeFill = useThemeColor(nodeColor ?? "muted-foreground") ?? "transparent";
	const frameStroke = useThemeColor("primary") ?? "transparent";

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

	const transform = useDerivedValue(() => {
		const { scale, x, y } = fit.value.transform;
		return [{ translateX: x }, { translateY: y }, { scale }];
	});
	const frame = useDerivedValue(() => fit.value.visible);
	const frameWidth = useDerivedValue(() => 1.5 / fit.value.transform.scale);

	return (
		<Surface
			accessibilityElementsHidden
			className={slots.miniMap({ className })}
			importantForAccessibility="no-hide-descendants"
			padding="none"
			pointerEvents="none"
			style={{ height, width }}
		>
			<Canvas style={{ height, width }}>
				<Group transform={transform}>
					{shapes.map((shape) => (
						<FlowMiniMapBlock fill={nodeFill} key={shape.id} shape={shape} />
					))}
					<Rect color={frameStroke} rect={frame} strokeWidth={frameWidth} style="stroke" />
				</Group>
			</Canvas>
		</Surface>
	);
}
FlowMiniMap.displayName = "DelacourUI.Flow.MiniMap";
