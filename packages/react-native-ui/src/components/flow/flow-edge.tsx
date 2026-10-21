import { type ReactElement, useEffect } from "react";
import {
	cancelAnimation,
	Easing,
	useDerivedValue,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { DashPathEffect, Group, Path, Skia, type SkPath } from "react-native-skia";
import { useFlowCanvasLayer, useFlowPart } from "./flow.context";
import { FLOW_DEFAULTS, resolveArrowSize, resolveEdgeDash, resolveFlowCanvasToken } from "./flow.variants";
import {
	type FlowEdgeVariant,
	type FlowEndpointReference,
	type FlowSide,
	flowGeometry,
	parseEndpoint,
} from "./flow-geometry";

/** A route as a Skia path — an empty one for the frames before both ends have measured. */
function toSkiaPath(d: string | undefined): SkPath {
	"worklet";
	return (d ? Skia.Path.MakeFromSVGString(d) : null) ?? Skia.Path.Make();
}

export type FlowEdgeProps = {
	/** `"nodeId"` or `"nodeId.handleId"`. */
	from: FlowEndpointReference;
	/** `"nodeId"` or `"nodeId.handleId"`. */
	to: FlowEndpointReference;
	/** How the line is routed between the two ends. */
	variant?: FlowEdgeVariant;
	/** Marches the dashes toward the target. Holds still under calm motion. */
	isAnimated?: boolean;
	isDashed?: boolean;
	/** A theme token or a literal. Defaults to `muted-foreground`. */
	color?: string;
	/** The stroke, in graph units — it scales with the zoom, like the nodes. */
	width?: number;
	/** An arrowhead at the target end. */
	hasArrow?: boolean;
	/** Overrides the side the edge leaves from — the handle's, or the automatic one. */
	fromSide?: FlowSide;
	/** Overrides the side the edge arrives on. */
	toSide?: FlowSide;
	/** `smoothstep`'s corner radius. */
	radius?: number;
	/** How far `step` and `smoothstep` stand off a side before turning. */
	gap?: number;
	/** How far `bezier` bows. */
	curvature?: number;
};

/**
 * A line between two nodes, routed from where they are now.
 *
 * **The route is a worklet over the nodes' shared values.** A drag writes a node's position on the
 * UI thread with no React render, and this edge's `useDerivedValue` reads that same position — so
 * it follows the drag on the same frame rather than a render behind. The React side only says
 * which nodes and which handles; it never sees a coordinate.
 *
 * **It draws nothing until both ends have measured**, rather than one frame from a zero rect at
 * the origin. An edge naming a node that never mounts stays empty.
 *
 * Hidden from assistive technology: a node's "Connect" actions and its label already say what it
 * joins, and a line has no name of its own.
 */
export function FlowEdge({
	from,
	to,
	variant = "bezier",
	isAnimated = false,
	isDashed = false,
	color,
	width = FLOW_DEFAULTS.edgeWidth,
	hasArrow = false,
	fromSide,
	toSide,
	radius = FLOW_DEFAULTS.edgeRadius,
	gap = FLOW_DEFAULTS.edgeGap,
	curvature = FLOW_DEFAULTS.edgeCurvature,
}: FlowEdgeProps): ReactElement | null {
	const { registry } = useFlowPart("Flow.Edge");
	const layer = useFlowCanvasLayer();
	const isCalm = layer?.isCalm ?? false;
	const token = resolveFlowCanvasToken(FlowEdge.displayName, color);
	const stroke = (token === undefined ? undefined : layer?.colors[token]) ?? "transparent";

	const source = parseEndpoint(from);
	const target = parseEndpoint(to);
	// Only the shared values go into the worklet. A captured plain object is frozen in development,
	// and an entry's `meta` is written by its node long after this edge first renders.
	const { position: sourcePosition, size: sourceSize, handles: sourceHandles } = registry.ensure(source.nodeId);
	const { position: targetPosition, size: targetSize, handles: targetHandles } = registry.ensure(target.nodeId);
	const sourceHandleId = source.handleId;
	const targetHandleId = target.handleId;
	const arrowSize = resolveArrowSize(width, hasArrow);
	const dash = resolveEdgeDash({ isAnimated, isDashed, width });

	const geometry = useDerivedValue(() =>
		flowGeometry().resolveEdgeGeometry({
			arrowSize,
			curvature,
			fromSide,
			gap,
			radius,
			sourceHandle: sourceHandleId === undefined ? undefined : sourceHandles.value[sourceHandleId],
			sourceRect: { ...sourcePosition.value, ...sourceSize.value },
			targetHandle: targetHandleId === undefined ? undefined : targetHandles.value[targetHandleId],
			targetRect: { ...targetPosition.value, ...targetSize.value },
			toSide,
			variant,
		})
	);

	const dashOffset = useSharedValue(0);
	const shouldMarch = isAnimated && !isCalm && dash.cycle > 0;

	useEffect(() => {
		if (!shouldMarch) {
			cancelAnimation(dashOffset);
			dashOffset.value = 0;
			return;
		}
		dashOffset.value = 0;
		dashOffset.value = withRepeat(
			withTiming(-dash.cycle, { duration: FLOW_DEFAULTS.dashDuration, easing: Easing.linear }),
			-1,
			false
		);
		return () => cancelAnimation(dashOffset);
	}, [dash.cycle, dashOffset, shouldMarch]);

	const linePath = useDerivedValue(() => toSkiaPath(geometry.value?.d));
	const lineOpacity = useDerivedValue(() => (geometry.value ? 1 : 0));
	const arrowPath = useDerivedValue(() => toSkiaPath(geometry.value?.arrow));
	const arrowOpacity = useDerivedValue(() => (geometry.value?.arrow ? 1 : 0));

	if (layer === null) {
		if (process.env.NODE_ENV !== "production") {
			console.warn(
				`Flow.Edge ${from} → ${to}: render edges as direct children of <Flow> (or from a .map() there), ` +
					"where the canvas can draw them."
			);
		}
		return null;
	}

	return (
		<Group>
			<Path
				color={stroke}
				opacity={lineOpacity}
				path={linePath}
				strokeCap="round"
				strokeJoin="round"
				strokeWidth={width}
				style="stroke"
			>
				{dash.dashArray ? <DashPathEffect intervals={dash.dashArray} phase={dashOffset} /> : null}
			</Path>
			{hasArrow ? <Path color={stroke} opacity={arrowOpacity} path={arrowPath} strokeJoin="round" /> : null}
		</Group>
	);
}
FlowEdge.displayName = "DelacourUI.Flow.Edge";
