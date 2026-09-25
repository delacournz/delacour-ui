import type { ReactElement } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { RATING_EMPTY_OPACITY, RATING_STAR_PATH, RATING_STAR_STROKE } from "./rating.variants";

export type RatingStarProps = {
	/** How much of the star is filled, 0–1. */
	fill: number;
	/** The resolved colour of the filled part. */
	fillColor: string | undefined;
	/** The resolved colour of the empty star, drawn at {@link RATING_EMPTY_OPACITY}. */
	emptyColor: string | undefined;
	/** The `size-icon-*` box the glyph fills. */
	glyphClassName: string;
	/** The clip window's class. Its width is set here, from `fill`. */
	clipClassName: string;
};

/**
 * One star: an empty glyph, and a filled one clipped to `fill` of its width.
 *
 * **Two layers rather than a gradient.** A hard-stop linear gradient on one path
 * would draw the half star too, but its stops are paint props that React Native
 * SVG re-parses on every change, and a clip is a `View` width the layout engine
 * already animates cheaply. The filled glyph inside the clip keeps the full
 * glyph's size — it is the *window* that narrows, never the star.
 *
 * Both glyphs are sized by a `size-icon-*` class on a `View` and fill it at
 * `100%`, which keeps the icon scale the single source of the size without
 * wrapping `Svg` in `withUniwind` (rule 7).
 *
 * Internal: `Rating.Stars` renders one per count, and nothing outside reaches it.
 */
export function RatingStar({
	fill,
	fillColor,
	emptyColor,
	glyphClassName,
	clipClassName,
}: RatingStarProps): ReactElement {
	return (
		<View className={glyphClassName}>
			<StarGlyph color={emptyColor} opacity={RATING_EMPTY_OPACITY} />
			{fill > 0 ? (
				<View className={clipClassName} style={{ width: `${fill * 100}%` }}>
					<View className={glyphClassName}>
						<StarGlyph color={fillColor} opacity={1} />
					</View>
				</View>
			) : null}
		</View>
	);
}
RatingStar.displayName = "DelacourUI.Rating.Stars.Star";

/**
 * The path itself, filled and stroked in one colour so the points come out rounded.
 *
 * The opacity is the whole view's, not the path's `fillOpacity` and
 * `strokeOpacity`: half the stroke overlaps the fill, and two translucent paints
 * over one another draw a darker ring round every empty star.
 */
function StarGlyph({ color, opacity }: { color: string | undefined; opacity: number }): ReactElement {
	return (
		<Svg height="100%" style={{ opacity }} viewBox="0 0 24 24" width="100%">
			<Path d={RATING_STAR_PATH} fill={color} stroke={color} strokeLinejoin="round" strokeWidth={RATING_STAR_STROKE} />
		</Svg>
	);
}
StarGlyph.displayName = "DelacourUI.Rating.Stars.Star.Glyph";
