import { type ReactElement, useId } from "react";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import { Circle, Defs, Path, Pattern, Rect } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useFlowPart, useIsInFlowSvgLayer } from "./flow.context";
import { FLOW_DEFAULTS, type FlowBackgroundVariant, resolveBackgroundPattern } from "./flow.variants";
import { flowGeometry } from "./flow-geometry";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export type FlowBackgroundProps = {
	/** The mark each tile repeats. */
	variant?: FlowBackgroundVariant;
	/** The tile's edge, in graph units — it scales with the zoom. */
	gap?: number;
	/** The mark's weight: a dot's radius, twice a line's or a cross's stroke. */
	size?: number;
	/** A theme token or a literal. Defaults to `border`. */
	color?: string;
};

/**
 * The tile's mark, drawn once inside the pattern.
 *
 * Above the `return` rather than inline: the three marks are a discriminated union and each
 * branch reads only its own fields.
 */
function FlowBackgroundMark({
	pattern,
	color,
}: {
	pattern: ReturnType<typeof resolveBackgroundPattern>;
	color: string | undefined;
}): ReactElement | null {
	if (pattern.kind === "none") return null;
	if (pattern.kind === "dots") return <Circle cx={pattern.cx} cy={pattern.cy} fill={color} r={pattern.r} />;
	return <Path d={pattern.d} fill="none" stroke={color} strokeWidth={pattern.strokeWidth} />;
}
FlowBackgroundMark.displayName = "DelacourUI.Flow.Background.Mark";

/**
 * The canvas's backdrop — dots, lines or crosses on a grid that pans and zooms with the graph.
 *
 * **One rect, filled with a pattern, sized to what is on screen.** The pattern is in graph units
 * inside the canvas's transformed group, so it scales with the zoom for free; the rect is resized
 * every frame to the visible part of the graph, so there is no edge to pan past and no tile drawn
 * off screen. Hidden from assistive technology with the rest of the SVG layer.
 */
export function FlowBackground({
	variant = "dots",
	gap = FLOW_DEFAULTS.backgroundGap,
	size = FLOW_DEFAULTS.backgroundSize,
	color,
}: FlowBackgroundProps): ReactElement | null {
	const { viewport, container } = useFlowPart("Flow.Background");
	const isInLayer = useIsInFlowSvgLayer();
	const fill = useThemeColor(color ?? "border");
	const patternId = `flow-bg-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
	const pattern = resolveBackgroundPattern(variant, gap, size);

	const rectProps = useAnimatedProps(() => {
		const visible = flowGeometry().visibleGraphRect(viewport.value, container.value);
		return { height: visible.height, width: visible.width, x: visible.x, y: visible.y };
	});

	if (!isInLayer) {
		if (process.env.NODE_ENV !== "production") {
			console.warn("Flow.Background: render it as a direct child of <Flow>, where the canvas can draw it.");
		}
		return null;
	}
	if (pattern.kind === "none") return null;

	return (
		<>
			<Defs>
				<Pattern height={pattern.tile} id={patternId} patternUnits="userSpaceOnUse" width={pattern.tile} x={0} y={0}>
					<FlowBackgroundMark color={fill} pattern={pattern} />
				</Pattern>
			</Defs>
			<AnimatedRect animatedProps={rectProps} fill={`url(#${patternId})`} />
		</>
	);
}
FlowBackground.displayName = "DelacourUI.Flow.Background";
