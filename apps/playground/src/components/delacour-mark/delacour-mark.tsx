import {
	DELACOUR_BOTTOM_CENTRE_Y,
	DELACOUR_CANVAS,
	DELACOUR_CARD_COLOUR,
	DELACOUR_CENTRE_X,
	DELACOUR_GLYPH_VIEW_BOX,
	DELACOUR_RECT_X,
	DELACOUR_SQUARE,
	DELACOUR_STROKE,
	DELACOUR_STROKE_COLOUR,
	DELACOUR_TOP_CENTRE_Y,
	delacourRectY,
} from "@delacour/brand";
import type { ReactElement } from "react";
import Svg, { G, Rect, type SvgProps } from "react-native-svg";

type DelacourArtProps = Omit<SvgProps, "width" | "height" | "viewBox" | "fill"> & {
	/** Edge length in points. Both art variants are square. */
	size?: number;
};

export type DelacourIconProps = DelacourArtProps;

export type DelacourMarkProps = DelacourArtProps & {
	/** Stroke colour. Defaults to the brand amber. */
	color?: string;
};

/**
 * The two diamonds, drawn from the same numbers the master SVG uses.
 *
 * The rotation rides a `transform` string rather than the `rotation` /
 * `originX` / `originY` props: those are deprecated in react-native-svg 15, and
 * on a `Rect` the sibling `x` / `y` transform props collide with the rect's own
 * geometry attributes. The string is parsed by the same SVG grammar the browser
 * uses, so this line is byte-identical to `@delacour/brand`'s master art.
 */
function DelacourGlyph({ stroke }: { stroke: string }): ReactElement {
	return (
		<G fill="none" stroke={stroke} strokeLinejoin="miter" strokeMiterlimit={10} strokeWidth={DELACOUR_STROKE}>
			{[DELACOUR_TOP_CENTRE_Y, DELACOUR_BOTTOM_CENTRE_Y].map((centreY) => (
				<Rect
					height={DELACOUR_SQUARE}
					key={centreY}
					transform={`rotate(45 ${DELACOUR_CENTRE_X} ${centreY})`}
					width={DELACOUR_SQUARE}
					x={DELACOUR_RECT_X}
					y={delacourRectY(centreY)}
				/>
			))}
		</G>
	);
}

/**
 * The app icon, exactly: the `#18181B` card with the amber mark on it.
 *
 * Full-bleed and square-cornered, the way the PNG in `assets/` is — iOS applies
 * its own mask and Android takes the glyph into its adaptive safe zone. Clip it
 * yourself (`rounded-2xl overflow-hidden` on a parent) to preview the launcher.
 *
 * The colours are brand literals rather than theme tokens on purpose: this is
 * the icon, and it looks the same in both themes.
 *
 * @example
 * <DelacourIcon size={96} />
 *
 * @example
 * <View className="overflow-hidden rounded-2xl">
 *   <DelacourIcon size={60} />
 * </View>
 */
export function DelacourIcon({ size = 64, ...props }: DelacourIconProps): ReactElement {
	return (
		<Svg height={size} viewBox={`0 0 ${DELACOUR_CANVAS} ${DELACOUR_CANVAS}`} width={size} {...props}>
			<Rect fill={DELACOUR_CARD_COLOUR} height={DELACOUR_CANVAS} width={DELACOUR_CANVAS} x={0} y={0} />
			<DelacourGlyph stroke={DELACOUR_STROKE_COLOUR} />
		</Svg>
	);
}

/**
 * The mark alone — no card, transparent, recolourable — for use inside ordinary
 * React Native views.
 *
 * Its viewBox is the glyph's own bounding square, so `size` is the height you
 * actually get rather than a canvas the mark floats in the middle of. The side
 * margins that leaves are the proportion the art was drawn at.
 *
 * @example
 * <DelacourMark size={32} />
 *
 * @example
 * <DelacourMark color="#FAFAFA" size={20} />
 */
export function DelacourMark({ color = DELACOUR_STROKE_COLOUR, size = 32, ...props }: DelacourMarkProps): ReactElement {
	return (
		<Svg height={size} viewBox={DELACOUR_GLYPH_VIEW_BOX} width={size} {...props}>
			<DelacourGlyph stroke={color} />
		</Svg>
	);
}
