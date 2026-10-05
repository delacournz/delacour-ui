import { memo, type ReactElement, useId } from "react";
import Svg, { Defs, Path, Text as SvgText, TextPath } from "react-native-svg";

export type CircularTextRingProps = {
	/** Edge of the square drawn in. */
	box: number;
	/** The text path, from `resolveCirclePath`. */
	d: string;
	text: string;
	/** Arc length to spread the text across, or `undefined` for natural advance. */
	textLength: number | undefined;
	fill: string | undefined;
	fontSize: number;
	fontFamily: string | undefined;
	fontWeight: string | undefined;
	letterSpacing: number | undefined;
};

/**
 * The ring itself: an `Svg` with the text on a path.
 *
 * Laid out once by the platform's shaper — the native `TextPath` measures kerning and advances, so
 * nothing here measures a glyph — and then only the wrapper's layer transform changes while the
 * ring turns. `memo`, because its props are frozen while spinning: re-rendering a `TextPath` every
 * frame would re-lay-out every glyph.
 *
 * `textLength` with `lengthAdjust="spacing"` closes a full ring exactly, whatever the font: the
 * engine opens or tightens the letter spacing rather than scaling the glyphs.
 *
 * Hidden from assistive technology — the wrapper carries the label, once, without the repeats.
 */
export const CircularTextRing = memo(function CircularTextRing({
	box,
	d,
	fill,
	fontFamily,
	fontSize,
	fontWeight,
	letterSpacing,
	text,
	textLength,
}: CircularTextRingProps): ReactElement {
	// SVG ids are global to the document, and React's `«r1»` ids are invalid inside `url(#…)`.
	const id = `circular-text-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

	return (
		<Svg
			accessibilityElementsHidden
			height={box}
			importantForAccessibility="no-hide-descendants"
			viewBox={`0 0 ${box} ${box}`}
			width={box}
		>
			<Defs>
				<Path d={d} id={id} />
			</Defs>
			<SvgText
				fill={fill}
				fontFamily={fontFamily}
				fontSize={fontSize}
				fontWeight={fontWeight}
				lengthAdjust={textLength === undefined ? undefined : "spacing"}
				letterSpacing={letterSpacing}
				textLength={textLength}
			>
				<TextPath href={`#${id}`}>{text}</TextPath>
			</SvgText>
		</Svg>
	);
});
CircularTextRing.displayName = "DelacourUI.CircularText.Ring";
