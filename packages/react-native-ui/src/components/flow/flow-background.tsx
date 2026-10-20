import type { ReactElement } from "react";
import { PixelRatio } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { Rect, Shader, Skia } from "react-native-skia";
import { useFlowCanvasLayer, useFlowPart } from "./flow.context";
import {
	FLOW_DEFAULTS,
	type FlowBackgroundVariant,
	resolveBackgroundPattern,
	resolveFlowCanvasToken,
} from "./flow.variants";
import { flowGeometry } from "./flow-geometry";

/**
 * Every mark as a signed distance in graph units, so one shader draws all three and the edge is
 * antialiased by `aa` — a device pixel in graph units, since runtime SkSL has no `fwidth`.
 * `shape` 0 is a dot in the middle of each tile, 1 a grid along the tile edges, 2 a centred cross.
 */
const BACKGROUND_SKSL = `
uniform float shape;
uniform float tile;
uniform float weight;
uniform float arm;
uniform float aa;
uniform vec4 color;

half4 main(vec2 p) {
	vec2 q = mod(p, tile);
	float d;
	if (shape < 0.5) {
		d = length(q - vec2(tile * 0.5)) - weight;
	} else if (shape < 1.5) {
		vec2 e = min(q, tile - q);
		d = min(e.x, e.y) - weight;
	} else {
		vec2 c = abs(q - vec2(tile * 0.5));
		d = min(max(c.x - arm, c.y - weight), max(c.y - arm, c.x - weight));
	}
	float a = color.a * (1.0 - smoothstep(-aa * 0.5, aa * 0.5, d));
	return half4(color.rgb * a, a);
}
`;

const BACKGROUND_EFFECT = Skia.RuntimeEffect.Make(BACKGROUND_SKSL);

const PIXEL_RATIO = PixelRatio.get();

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
 * The canvas's backdrop — dots, lines or crosses on a grid that pans and zooms with the graph.
 *
 * **One rect, filled by a shader, sized to what is on screen.** The shader works in graph units
 * inside the canvas's transformed group, so the marks scale with the zoom for free; the rect is
 * resized every frame to the visible part of the graph, so there is no edge to pan past and
 * nothing is shaded off screen. Hidden from assistive technology with the rest of the canvas.
 */
export function FlowBackground({
	variant = "dots",
	gap = FLOW_DEFAULTS.backgroundGap,
	size = FLOW_DEFAULTS.backgroundSize,
	color,
}: FlowBackgroundProps): ReactElement | null {
	const { viewport, container } = useFlowPart("Flow.Background");
	const layer = useFlowCanvasLayer();
	const token = resolveFlowCanvasToken(FlowBackground.displayName, color);
	const fill = token === undefined ? undefined : layer?.colors[token];
	const rgba = Array.from(Skia.Color(fill ?? "transparent"));
	const pattern = resolveBackgroundPattern(variant, gap, size);

	const visible = useDerivedValue(() => flowGeometry().visibleGraphRect(viewport.value, container.value));
	const uniforms = useDerivedValue(() => ({
		aa: 1 / (viewport.value.zoom * PIXEL_RATIO),
		arm: pattern.kind === "none" ? 0 : pattern.arm,
		color: rgba,
		shape: pattern.kind === "none" ? 0 : pattern.shape,
		tile: pattern.kind === "none" ? 1 : pattern.tile,
		weight: pattern.kind === "none" ? 0 : pattern.weight,
	}));

	if (layer === null) {
		if (process.env.NODE_ENV !== "production") {
			console.warn("Flow.Background: render it as a direct child of <Flow>, where the canvas can draw it.");
		}
		return null;
	}
	if (pattern.kind === "none" || BACKGROUND_EFFECT === null) return null;

	return (
		<Rect rect={visible}>
			<Shader source={BACKGROUND_EFFECT} uniforms={uniforms} />
		</Rect>
	);
}
FlowBackground.displayName = "DelacourUI.Flow.Background";
