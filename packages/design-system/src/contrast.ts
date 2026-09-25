/**
 * WCAG contrast for the `oklch()` literals the ramps are written in.
 *
 * Pure and dependency-free, like everything else here: the resolve matrix
 * runs under `bun test`, and a contrast check that needed `culori` would
 * pull a runtime dependency into a package that has none. The conversion
 * is the CSS Color 4 reference path — OKLab → linear sRGB → gamma — and
 * the ratio is WCAG 2's, so 3:1 here is the same 3:1 a browser audit reports.
 */

export type Oklch = { readonly l: number; readonly c: number; readonly h: number };
export type Rgb = { readonly r: number; readonly g: number; readonly b: number };

const OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/;

/** The three channels of an `oklch(l c h)` literal, or `undefined` for anything else. */
export function parseOklch(value: string): Oklch | undefined {
	const match = OKLCH.exec(value.trim());
	if (!match) return undefined;

	return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
}

function gamma(channel: number): number {
	const clamped = Math.min(1, Math.max(0, channel));
	return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

/** An OKLCH colour as 8-bit sRGB, clipped to the gamut. */
export function oklchToSrgb({ l, c, h }: Oklch): Rgb {
	const radians = (h * Math.PI) / 180;
	const a = c * Math.cos(radians);
	const b = c * Math.sin(radians);

	const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = l - 0.0894841775 * a - 1.291485548 * b;

	const l3 = l_ ** 3;
	const m3 = m_ ** 3;
	const s3 = s_ ** 3;

	const red = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
	const green = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
	const blue = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

	return {
		r: Math.round(gamma(red) * 255),
		g: Math.round(gamma(green) * 255),
		b: Math.round(gamma(blue) * 255),
	};
}

function linear(channel: number): number {
	const c = channel / 255;
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2 relative luminance, 0 for black and 1 for white. */
export function relativeLuminance({ r, g, b }: Rgb): number {
	return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * The WCAG 2 contrast ratio between two `oklch()` literals, 1 to 21.
 *
 * Symmetric, so the order of the arguments does not matter. Throws on a
 * value that is not `oklch()` rather than guessing: every ramp in this
 * package is written in it, so anything else is a bug upstream.
 */
export function contrastRatio(a: string, b: string): number {
	const first = parseOklch(a);
	const second = parseOklch(b);
	if (!first || !second) throw new Error(`contrastRatio: not oklch(): ${!first ? a : b}`);

	const la = relativeLuminance(oklchToSrgb(first));
	const lb = relativeLuminance(oklchToSrgb(second));
	const [hi, lo] = la > lb ? [la, lb] : [lb, la];

	return (hi + 0.05) / (lo + 0.05);
}
