import { matchFont, type SkFont } from "@shopify/react-native-skia";
import { useMemo } from "react";
import type { LabelMetrics } from "../core/text/label-anchor";

/** Re-exported so a consumer can hold a font without importing Skia itself. */
export type ChartFont = SkFont;

/**
 * A font from a family the operating system already has.
 *
 * No asset ships with this package, and none needs to: `matchFont` resolves
 * against the system font manager, so a chart is legible with no `expo-font`,
 * no config plugin and no Metro asset resolver in the consuming app.
 *
 * The trade is that iOS's system font is not Android's, so the same labels
 * measure differently and the plot rect differs by a few points across
 * platforms. That is correct behaviour rather than a bug — but it does mean a
 * screenshot baseline has to be per-platform, and an app that needs identical
 * layout on both must load and pass its own font.
 */
export function useSystemFont(family: string | undefined, size: number): SkFont {
	return useMemo(
		() => matchFont({ fontFamily: family ?? (undefined as unknown as string), fontSize: size }),
		[family, size]
	);
}

/**
 * The advance width of `text`, in points.
 *
 * Glyph advances summed, rather than `measureText`. `measureText` returns the
 * *drawn* bounds, which exclude side bearings — a tick reading "10" measures
 * narrower than the space it actually occupies, and the axis gutter comes out
 * a point or two too tight on every label. `getTextWidth` gives the advance
 * directly but is deprecated in Skia 2.x.
 */
export function measureLabelWidth(font: SkFont | null, text: string): number {
	if (font === null || text === "") return 0;
	let total = 0;
	for (const advance of font.getGlyphWidths(font.getGlyphIDs(text))) total += advance;
	return total;
}

/** Advance widths for a whole axis' worth of labels. */
export function measureLabelWidths(font: SkFont | null, labels: readonly string[]): number[] {
	return labels.map((label) => measureLabelWidth(font, label));
}

/**
 * Line height, from the font's own metrics.
 *
 * `ascent` is negative and `descent` positive, so the span between them is the
 * full glyph box — which is what an axis gutter has to reserve, not the
 * nominal point size.
 */
export function fontLineHeight(font: SkFont | null): number {
	const { ascent, descent } = fontMetrics(font);
	return ascent + descent;
}

/**
 * A font's ascent and descent, both as positive distances from the baseline.
 *
 * Skia reports `ascent` negative (it is a y offset in a downward-positive
 * space) and `descent` positive. Normalising both to magnitudes here is what
 * lets `anchorY` read as geometry rather than as sign juggling.
 */
export function fontMetrics(font: SkFont | null): LabelMetrics {
	if (font === null) return { ascent: 0, descent: 0 };
	const metrics = font.getMetrics();
	return { ascent: Math.abs(metrics.ascent), descent: Math.abs(metrics.descent) };
}
