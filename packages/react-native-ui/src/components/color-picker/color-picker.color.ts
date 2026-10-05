import type { ColorFormat, Hsla, Hsva, HsvaChannel, Rgba } from "./color-picker.types";

/**
 * The picker's colour maths — parsing, conversion, formatting and the geometry
 * the gestures map through.
 *
 * Free of React Native imports so `bun test` reaches all of it. The functions a
 * gesture or an animated style calls on the UI thread carry a `'worklet'`
 * directive, and every one of those is **flat**: none calls another. A
 * module-scope worklet binds at import time in source order, so one calling a
 * sibling works only while the sibling happens to be declared first — see
 * Slider's AGENTS.md. The JS-only helpers below are free to compose.
 *
 * `lib/color.ts` is deliberately not extended: it answers "is this a literal
 * colour" for the token reader and nothing else, and HSV belongs to this picker.
 */

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNCTION_PATTERN = /^(rgba?|hsla?)\((.*)\)$/;
const NUMBER_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)(%|deg)?$/;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function clampUnit(value: number): number {
	return clamp(value, 0, 1);
}

/** Hue folded into 0–360, with 360 itself folding to 0. */
function wrapHue(hue: number): number {
	return ((hue % 360) + 360) % 360;
}

/** Two decimal places, without trailing zeros — `0.5`, `0.33`, `1`. */
function formatAlpha(alpha: number): string {
	return String(Number(alpha.toFixed(2)));
}

/**
 * A `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` string as channels, or null.
 *
 * The `#` is required: a bare `ff0000` is as likely a typo in a free-text field
 * as it is a colour, and the field reports it invalid rather than guessing.
 */
export function hexToRgba(hex: string): Rgba | null {
	const match = HEX_PATTERN.exec(hex.trim());
	const digits = match?.[1];
	if (!digits) return null;

	const full =
		digits.length <= 4
			? digits
					.split("")
					.map((digit) => digit + digit)
					.join("")
			: digits;
	const channel = (index: number): number => Number.parseInt(full.slice(index * 2, index * 2 + 2), 16);

	return {
		r: channel(0),
		g: channel(1),
		b: channel(2),
		a: full.length === 8 ? channel(3) / 255 : 1,
	};
}

/** `#rrggbb`, or `#rrggbbaa` when the colour is translucent. Lower case, rounded and clamped. */
export function rgbaToHex({ r, g, b, a }: Rgba): string {
	const pair = (value: number): string =>
		Math.round(clamp(value, 0, 255))
			.toString(16)
			.padStart(2, "0");
	const alpha = clampUnit(a);
	return `#${pair(r)}${pair(g)}${pair(b)}${alpha < 1 ? pair(alpha * 255) : ""}`;
}

/** RGB to the picker's model. A grey reports hue 0; {@link preserveHue} is what keeps the old one. */
export function rgbToHsv({ r, g, b, a }: Rgba): Hsva {
	const red = r / 255;
	const green = g / 255;
	const blue = b / 255;
	const max = Math.max(red, green, blue);
	const delta = max - Math.min(red, green, blue);

	let hue = 0;
	if (delta > 0) {
		if (max === red) hue = ((green - blue) / delta) % 6;
		else if (max === green) hue = (blue - red) / delta + 2;
		else hue = (red - green) / delta + 4;
	}

	return { h: wrapHue(hue * 60), s: max === 0 ? 0 : delta / max, v: max, a };
}

/** The picker's model to whole-number RGB. Runs on the UI thread, for every animated swatch. */
export function hsvToRgb({ h, s, v, a }: Hsva): Rgba {
	"worklet";
	const hue = (((h % 360) + 360) % 360) / 60;
	const chroma = v * s;
	const x = chroma * (1 - Math.abs((hue % 2) - 1));
	const m = v - chroma;
	let red = 0;
	let green = 0;
	let blue = 0;
	if (hue < 1) [red, green, blue] = [chroma, x, 0];
	else if (hue < 2) [red, green, blue] = [x, chroma, 0];
	else if (hue < 3) [red, green, blue] = [0, chroma, x];
	else if (hue < 4) [red, green, blue] = [0, x, chroma];
	else if (hue < 5) [red, green, blue] = [x, 0, chroma];
	else [red, green, blue] = [chroma, 0, x];

	return {
		r: Math.round((red + m) * 255),
		g: Math.round((green + m) * 255),
		b: Math.round((blue + m) * 255),
		a,
	};
}

/** HSV to HSL. The hue carries across unchanged, including a grey's. */
export function hsvToHsl({ h, s, v, a }: Hsva): Hsla {
	const l = v * (1 - s / 2);
	const saturation = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
	return { h, s: saturation, l, a };
}

/** HSL to HSV. The hue carries across unchanged, including a grey's. */
export function hslToHsv({ h, s, l, a }: Hsla): Hsva {
	const v = l + s * Math.min(l, 1 - l);
	return { h, s: v === 0 ? 0 : 2 * (1 - l / v), v, a };
}

/** One argument of a functional notation: a number, a percentage, or degrees. */
function readNumber(token: string): { value: number; unit: "" | "%" | "deg" } | null {
	const match = NUMBER_PATTERN.exec(token);
	if (!match) return null;
	return { value: Number.parseFloat(token), unit: (match[2] ?? "") as "" | "%" | "deg" };
}

/** An alpha argument — a number or a percentage — clamped to 0–1. */
function readAlpha(token: string | undefined): number | null {
	if (token === undefined) return 1;
	const parsed = readNumber(token);
	if (!parsed || parsed.unit === "deg") return null;
	return clampUnit(parsed.unit === "%" ? parsed.value / 100 : parsed.value);
}

/**
 * Any accepted notation as the picker's model, or null.
 *
 * `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()` and
 * `hsla()` — commas or spaces, an optional `/ alpha`, any case, surrounding
 * whitespace ignored. A channel out of range is clamped rather than refused,
 * because `rgb(300, 0, 0)` has an obvious meaning; anything that is not a
 * colour at all is null, which is how the hex field knows to report it invalid
 * without touching the value.
 */
export function parseColor(input: string): Hsva | null {
	const text = input.trim().toLowerCase();
	if (text.startsWith("#")) {
		const rgba = hexToRgba(text);
		return rgba ? rgbToHsv(rgba) : null;
	}

	const match = FUNCTION_PATTERN.exec(text);
	if (!match?.[1] || match[2] === undefined) return null;
	const kind = match[1].startsWith("rgb") ? "rgb" : "hsl";
	const tokens = match[2]
		.replace("/", " ")
		.split(/[\s,]+/)
		.filter((token) => token.length > 0);
	if (tokens.length < 3 || tokens.length > 4) return null;

	const alpha = readAlpha(tokens[3]);
	if (alpha === null) return null;

	if (kind === "rgb") {
		const channels: number[] = [];
		for (const token of tokens.slice(0, 3)) {
			const parsed = readNumber(token);
			if (!parsed || parsed.unit === "deg") return null;
			channels.push(clamp(parsed.unit === "%" ? (parsed.value / 100) * 255 : parsed.value, 0, 255));
		}
		const [r = 0, g = 0, b = 0] = channels;
		return rgbToHsv({ r, g, b, a: alpha });
	}

	const hue = readNumber(tokens[0] ?? "");
	const saturation = readNumber(tokens[1] ?? "");
	const lightness = readNumber(tokens[2] ?? "");
	if (!hue || hue.unit === "%" || !saturation || saturation.unit === "deg" || !lightness || lightness.unit === "deg") {
		return null;
	}
	return hslToHsv({
		h: wrapHue(hue.value),
		s: clampUnit(saturation.value / 100),
		l: clampUnit(lightness.value / 100),
		a: alpha,
	});
}

/**
 * The model in the notation a caller asked for.
 *
 * `hex` is `#rrggbb`, or `#rrggbbaa` below full opacity. `rgb` and `hsl` switch
 * to their `a` forms below full opacity, with the alpha to two places. Every
 * channel is rounded, so this is what crosses to a caller — never the model's
 * own floats.
 */
export function formatColor(hsva: Hsva, format: ColorFormat): string {
	const alpha = clampUnit(hsva.a);
	if (format === "hex") return rgbaToHex(hsvToRgb({ ...hsva, a: alpha }));

	if (format === "rgb") {
		const { r, g, b } = hsvToRgb(hsva);
		return alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${formatAlpha(alpha)})` : `rgb(${r}, ${g}, ${b})`;
	}

	const { h, s, l } = hsvToHsl(hsva);
	const hue = Math.round(wrapHue(h));
	const body = `${hue}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
	return alpha < 1 ? `hsla(${body}, ${formatAlpha(alpha)})` : `hsl(${body})`;
}

/**
 * A point in the area as saturation (x) and brightness (y, top is full).
 *
 * Clamped, so a drag that leaves the box pins to its edge. A box not yet
 * measured reports the top-left corner rather than `NaN`.
 */
export function areaToHsv(x: number, y: number, width: number, height: number): { s: number; v: number } {
	"worklet";
	if (width <= 0 || height <= 0) return { s: 0, v: 1 };
	return {
		s: Math.min(1, Math.max(0, x / width)),
		v: 1 - Math.min(1, Math.max(0, y / height)),
	};
}

/** Saturation and brightness as a point in the area — the inverse of {@link areaToHsv}. */
export function hsvToArea(s: number, v: number, width: number, height: number): { x: number; y: number } {
	"worklet";
	return { x: s * width, y: (1 - v) * height };
}

/** An offset along a track of `travel` points as a value from 0 to `max`, clamped. `0` until measured. */
export function trackToValue(offset: number, travel: number, max: number): number {
	"worklet";
	if (travel <= 0) return 0;
	return Math.min(1, Math.max(0, offset / travel)) * max;
}

/** A value from 0 to `max` as an offset along a track of `travel` points. `0` until measured. */
export function valueToTrack(value: number, travel: number, max: number): number {
	"worklet";
	if (travel <= 0 || max <= 0) return 0;
	return Math.min(1, Math.max(0, value / max)) * travel;
}

/**
 * One assistive step on one channel.
 *
 * `step` is in the channel's own unit — degrees for hue, a fraction of one for
 * the rest. Hue wraps, because the wheel has no end; the others clamp.
 */
export function stepHsva(hsva: Hsva, channel: HsvaChannel, direction: 1 | -1, step: number): Hsva {
	const delta = direction * step;
	switch (channel) {
		case "hue":
			return { ...hsva, h: wrapHue(hsva.h + delta) };
		case "saturation":
			return { ...hsva, s: clampUnit(hsva.s + delta) };
		case "brightness":
			return { ...hsva, v: clampUnit(hsva.v + delta) };
		case "alpha":
			return { ...hsva, a: clampUnit(hsva.a + delta) };
	}
}

/**
 * Carries the old hue — and, at black, the old saturation — across a colour
 * that has none.
 *
 * A grey has no hue and black has neither, so a parse reports both as 0. Taken
 * literally, dragging brightness to the bottom would snap the hue track to red
 * and the area's thumb to the left edge, and dragging back up would come back
 * a different colour from the one that went down.
 */
export function preserveHue(next: Hsva, previous: Hsva): Hsva {
	if (next.v === 0) return { ...next, h: previous.h, s: previous.s };
	if (next.s === 0) return { ...next, h: previous.h };
	return next;
}

/**
 * Whether a value a caller passed back is the colour the picker already holds.
 *
 * The guard that stops a controlled echo from re-deriving the model. Compared
 * in the caller's own notation, after rounding, so a lossy `hsl()` echo of a
 * dragged colour does not nudge the thumb, and a grey or black echo does not
 * throw away the hue the picker remembers.
 */
export function isSameColor(value: string, hsva: Hsva, format: ColorFormat): boolean {
	const parsed = parseColor(value);
	if (!parsed) return false;
	return formatColor(preserveHue(parsed, hsva), format) === formatColor(hsva, format);
}

/** WCAG relative luminance, 0 for black to 1 for white. Alpha is ignored. */
export function relativeLuminance({ r, g, b }: Rgba): number {
	const linear = (channel: number): number => {
		const unit = channel / 255;
		return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * Black or white, whichever reads better on the colour.
 *
 * The threshold is the luminance at which the two contrast ratios are equal, so
 * neither side is favoured.
 */
export function contrastForeground(rgba: Rgba): "black" | "white" {
	return relativeLuminance(rgba) > 0.179 ? "black" : "white";
}

const HUE_NAMES: readonly { below: number; name: string }[] = [
	{ below: 15, name: "red" },
	{ below: 45, name: "orange" },
	{ below: 75, name: "yellow" },
	{ below: 150, name: "green" },
	{ below: 195, name: "cyan" },
	{ below: 255, name: "blue" },
	{ below: 285, name: "purple" },
	{ below: 330, name: "magenta" },
	{ below: 345, name: "pink" },
	{ below: 361, name: "red" },
];

/** A plain name for a hue, for a screen reader — "Hue 210 degrees, blue". */
export function describeHue(hue: number): string {
	const wrapped = wrapHue(hue);
	return HUE_NAMES.find((entry) => wrapped < entry.below)?.name ?? "red";
}

/**
 * The same RGB at another alpha, as an `rgba()` string.
 *
 * What the alpha track's far stop is drawn with. It is never the keyword
 * `transparent`, which is transparent *black*: a gradient towards it passes
 * through grey and blooms a dirty band across the middle of the track.
 */
export function withAlpha({ r, g, b }: Rgba, alpha: number): string {
	return `rgba(${r}, ${g}, ${b}, ${formatAlpha(clampUnit(alpha))})`;
}
