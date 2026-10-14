import { type ReactElement, type ReactNode, useCallback } from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";
import { IconEraser, IconPencil } from "../../icons/central";
import { Icon, type IconComponent } from "../icon";
import { ToggleButton, type ToggleButtonProps } from "../toggle-button";
import { useSketchPart } from "./sketch.context";
import { buildSketchShapePath, SKETCH_SHAPES, type SketchShape } from "./sketch.paths";
import { SKETCH_LABELS } from "./sketch.variants";

export type SketchToolProps = Omit<
	ToggleButtonProps,
	"value" | "isSelected" | "defaultSelected" | "onSelected" | "children"
> &
	(
		| { tool: "pen" | "eraser"; shape?: never }
		/** `shape` picks that shape. Omitted, the button switches to the shape tool with whatever shape is current. */
		| { tool: "shape"; shape?: SketchShape }
	) & {
		/** Replaces the default glyph. */
		children?: ReactNode;
	};

/**
 * A glyph for one shape, drawn by the same maths the canvas uses.
 *
 * Central Icons has no star-and-heart set that matches the eight shapes one for
 * one, and a toolbar glyph that is not the shape the tool draws is a small lie.
 * So each glyph is `buildSketchShapePath` in a 24-point box, at the icon set's
 * own 1.5 stroke — and shaped like Central's components so `Icon` sizes and
 * colours it exactly as it would one of theirs.
 */
function createShapeGlyph(shape: SketchShape): IconComponent {
	const isDiagonal = shape === "line" || shape === "arrow";
	const d = isDiagonal
		? buildSketchShapePath(shape, { x: 5, y: 19 }, { x: 19, y: 5 }, 1.5)
		: buildSketchShapePath(shape, { x: 4, y: 4.5 }, { x: 20, y: 19.5 }, 1.5);

	function ShapeGlyph({ size = 24, color, ...props }: SvgProps & { size?: number | string }): ReactElement {
		return (
			<Svg fill="none" height={size} viewBox="0 0 24 24" width={size} {...props}>
				<Path d={d ?? ""} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
			</Svg>
		);
	}
	ShapeGlyph.displayName = `DelacourUI.Sketch.ShapeGlyph.${shape}`;
	return ShapeGlyph;
}

const SHAPE_GLYPHS = Object.fromEntries(SKETCH_SHAPES.map((shape) => [shape, createShapeGlyph(shape)])) as Record<
	SketchShape,
	IconComponent
>;

/**
 * One tool: the pen, the eraser, or a shape.
 *
 * A `ToggleButton` — ghost at rest, filled when it is the tool in hand — so it
 * announces itself as pressed or not. The sketch's tools are one-of-N across two
 * props, the tool and the shape, which is why this does not use
 * `ToggleButton.Group`: a group selects by one value.
 *
 * A shape button is selected when the shape tool is in hand with that shape; a
 * shape button with no `shape` — the default toolbar's — whenever the shape tool
 * is, and it shows the current shape.
 */
export function SketchTool({
	tool,
	shape,
	children,
	size = "icon-md",
	variant = "ghost",
	accessibilityLabel,
	onPress,
	...props
}: SketchToolProps): ReactElement {
	const context = useSketchPart("Sketch.Tool");
	const glyphShape = shape ?? context.shape;
	const isSelected = context.tool === tool && (tool !== "shape" || shape === undefined || shape === context.shape);

	const handlePress = useCallback(() => {
		onPress?.();
		context.setTool(tool);
		if (tool === "shape" && shape !== undefined) context.setShape(shape);
	}, [context, onPress, shape, tool]);

	const glyph = tool === "pen" ? IconPencil : tool === "eraser" ? IconEraser : SHAPE_GLYPHS[glyphShape];
	const label = tool === "shape" ? SKETCH_LABELS[glyphShape] : SKETCH_LABELS[tool];

	return (
		<ToggleButton
			{...props}
			accessibilityLabel={accessibilityLabel ?? label}
			haptic={context.haptic}
			isDisabled={context.isDisabled}
			isSelected={isSelected}
			onPress={handlePress}
			size={size}
			variant={variant}
		>
			{children ?? <Icon icon={glyph} />}
		</ToggleButton>
	);
}
SketchTool.displayName = "DelacourUI.Sketch.Tool";
