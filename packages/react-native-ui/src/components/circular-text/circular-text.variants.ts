/**
 * CircularText's geometry and resolvers, free of React Native imports so every decision is
 * reachable from `bun test`. Angles are degrees, 0 at 12 o'clock, growing clockwise on screen.
 */

export const CIRCULAR_TEXT_DIRECTIONS = ["clockwise", "counterclockwise"] as const;
export type CircularTextDirection = (typeof CIRCULAR_TEXT_DIRECTIONS)[number];

/** `outside`: glyph tops point away from the centre. `inside`: toward it. */
export const CIRCULAR_TEXT_SIDES = ["outside", "inside"] as const;
export type CircularTextSide = (typeof CIRCULAR_TEXT_SIDES)[number];

/** How much of the circle the text spans. */
export type CircularTextSpan =
	/** Spread to close the ring exactly, whatever the font's metrics. */
	| { kind: "full" }
	/** Spread across `sweep` degrees, from `startAngle` — by default centred on the top. */
	| { kind: "arc"; sweep: number; startAngle?: number }
	/** Laid out at the font's own advance from `startAngle`. May not close the ring. */
	| { kind: "natural"; startAngle?: number };

/** Degrees per second a `loop` turns at when no `speed` is given — slow enough to read. */
export const CIRCULAR_TEXT_DEFAULT_SPEED = 24;

/** Milliseconds a pause or a speed change eases over. */
export const CIRCULAR_TEXT_EASE_MS = 400;

/** Default separator written between repeated copies. */
export const CIRCULAR_TEXT_DEFAULT_SEPARATOR = " • ";

/**
 * Average advance of a glyph as a fraction of the font size, for `repeat: "fill"`. Only an
 * estimate: `textLength` absorbs the error as spacing.
 */
export const CIRCULAR_TEXT_AVERAGE_ADVANCE = 0.58;

/**
 * Half the cap height, as a fraction of the font size. `radius` is the text's centreline, so the
 * baseline sits this far from it toward the glyph feet.
 */
const HALF_CAP = 0.35;

/** How far a glyph reaches past its baseline away from its feet (ascender) and toward them (descender). */
const ASCENDER = 0.95;
const DESCENDER = 0.25;

/** Rounds a coordinate to three places, and never prints `-0`. */
function round(value: number): number {
	const rounded = Math.round(value * 1000) / 1000;
	return rounded === 0 ? 0 : rounded;
}

export function resolveCircumference(radius: number): number {
	return 2 * Math.PI * radius;
}

/** The arc length of `sweep` degrees at `radius` — what `textLength` is set to. */
export function resolveRingLength(radius: number, sweep: number): number {
	return (resolveCircumference(radius) * sweep) / 360;
}

/**
 * The radius the text path is drawn at.
 *
 * `radius` names the middle of the type, not its baseline, so `outside` and `inside` rings of the
 * same radius sit on the same circle — and two rings nest by radius alone. Outside, the feet point
 * inward, so the baseline moves in; inside, out.
 */
export function resolveBaselineRadius(radius: number, fontSize: number, side: CircularTextSide): number {
	return side === "outside" ? radius - fontSize * HALF_CAP : radius + fontSize * HALF_CAP;
}

/**
 * The edge of the square the ring is drawn in, in whole points.
 *
 * The outermost ink is the ascenders on an outside ring and the descenders on an inside one, both
 * measured from the baseline; the box is twice that, rounded up.
 */
export function resolveRingBox(radius: number, fontSize: number, side: CircularTextSide): number {
	const baseline = resolveBaselineRadius(radius, fontSize, side);
	const reach = side === "outside" ? baseline + fontSize * ASCENDER : baseline + fontSize * DESCENDER;
	return Math.ceil(2 * reach);
}

export function resolveSpan(span: CircularTextSpan): { startAngle: number; sweep: number; hasLength: boolean } {
	switch (span.kind) {
		case "full":
			return { startAngle: 0, sweep: 360, hasLength: true };
		case "arc": {
			const sweep = Math.min(360, Math.max(1, Math.abs(span.sweep)));
			return { startAngle: span.startAngle ?? -sweep / 2, sweep, hasLength: true };
		}
		case "natural":
			return { startAngle: span.startAngle ?? 0, sweep: 360, hasLength: false };
	}
}

/** The point at `angle` on a circle. */
function pointAt(cx: number, cy: number, radius: number, angle: number): string {
	const radians = (angle * Math.PI) / 180;
	return `${round(cx + radius * Math.sin(radians))} ${round(cy - radius * Math.cos(radians))}`;
}

/**
 * The text path's `d`.
 *
 * **The path's travel direction is the glyph orientation.** A `TextPath` stands each glyph on the
 * path with its top to the path's left, so a clockwise path puts the tops outside and a
 * counterclockwise one puts them inside. `side` therefore picks the direction, and the spin
 * direction is a separate axis — coupling them would make two of the four combinations mirror
 * writing.
 *
 * A full circle is two half-circle arcs, because one `A` whose ends coincide draws nothing. An
 * inside arc covers the same stretch of circle as an outside one, travelling from its end back to
 * its start — so the words read left to right along the bottom.
 */
export function resolveCirclePath(
	cx: number,
	cy: number,
	radius: number,
	startAngle: number,
	sweep: number,
	side: CircularTextSide
): string {
	const r = round(radius);
	const flag = side === "outside" ? 1 : 0;

	if (sweep >= 360) {
		const start = pointAt(cx, cy, radius, startAngle);
		const opposite = pointAt(cx, cy, radius, startAngle + 180);
		return `M ${start} A ${r} ${r} 0 0 ${flag} ${opposite} A ${r} ${r} 0 0 ${flag} ${start}`;
	}

	const largeArc = Math.abs(sweep) > 180 ? 1 : 0;
	const from = side === "outside" ? startAngle : startAngle + sweep;
	const to = side === "outside" ? startAngle + sweep : startAngle;
	return `M ${pointAt(cx, cy, radius, from)} A ${r} ${r} 0 ${largeArc} ${flag} ${pointAt(cx, cy, radius, to)}`;
}

/**
 * The letter spacing that spreads a run measured at `naturalWidth` across `length`.
 *
 * The fallback for `textLength`, which iOS's `react-native-svg` ignores: SVG letter spacing is
 * added after every glyph, the last included, so the shortfall over `glyphCount` lands the run
 * exactly at the length — and the trailing gap is the seam where a full ring closes. `base` is
 * the typography's own tracking, already inside the measured width.
 */
export function resolveFillLetterSpacing(
	length: number,
	naturalWidth: number,
	glyphCount: number,
	base: number
): number {
	if (!(naturalWidth > 0) || !(glyphCount > 0)) return base;
	return base + (length - naturalWidth) / glyphCount;
}

/** Glyphs as a reader counts them — code points, so an astral symbol is one. */
export function countGlyphs(text: string): number {
	return Array.from(text).length;
}

/**
 * How many copies close the ring, for `repeat: "fill"`.
 *
 * Floored rather than rounded: an overestimate would ask `textLength` for negative spacing and the
 * glyphs would collide, where an underestimate only opens the spacing a little.
 */
export function resolveRepeatCount(
	circumference: number,
	glyphCount: number,
	fontSize: number,
	separatorGlyphs: number
): number {
	const unit = (glyphCount + separatorGlyphs) * CIRCULAR_TEXT_AVERAGE_ADVANCE * fontSize;
	if (!(unit > 0)) return 1;
	return Math.max(1, Math.floor(circumference / unit));
}

/** How many copies to draw: an explicit count, or a `"fill"` estimate over `length`. */
export function resolveCopies(
	repeat: number | "fill",
	text: string,
	separator: string,
	length: number,
	fontSize: number
): number {
	if (repeat !== "fill") return repeat;
	const unit = separator.length > 0 && text.endsWith(separator) ? text.slice(0, -separator.length) : text;
	return resolveRepeatCount(length, countGlyphs(unit), fontSize, countGlyphs(separator));
}

/**
 * The string drawn on the ring.
 *
 * One copy is the caller's text exactly — a trailing separator they wrote is theirs, and one they
 * left off closes the ring with no gap. More than one writes the separator after every copy, so the
 * seam where the ring closes looks like every other join, and never doubles one already there.
 */
export function resolveRingText(text: string, repeat: number, separator: string): string {
	const copies = Math.max(1, Math.floor(repeat));
	if (copies === 1) return text;
	const unit = separator.length > 0 && text.endsWith(separator) ? text : `${text}${separator}`;
	return unit.repeat(copies);
}

/**
 * What a screen reader says: the words once, without the separators — "DELACOUR • UI •" would
 * otherwise be read "DELACOUR bullet UI bullet".
 */
export function resolveRingLabel(text: string, separator: string): string {
	const mark = separator.trim();
	const words = mark.length > 0 ? text.split(mark).join(" ") : text;
	return words.replace(/\s+/g, " ").trim();
}

/** Signed degrees per second. `direction` owns the sign, so a negative `speed` cannot reverse it. */
export function resolveSpinVelocity(direction: CircularTextDirection, speed: number): number {
	const magnitude = Math.abs(speed);
	return direction === "clockwise" ? magnitude : -magnitude;
}

/**
 * One frame of the integrator: `rotation + dt·velocity`, wrapped into [0, 360).
 *
 * The wrap is invisible because a turn of 360° is the identity, and it keeps the float from
 * drifting over a long-lived screen.
 */
export function advanceRotation(rotation: number, dtMs: number, velocity: number): number {
	"worklet";
	const next = (((rotation + (dtMs / 1000) * velocity) % 360) + 360) % 360;
	return next === 0 || next === 360 ? 0 : next;
}

/**
 * Each glyph's starting angle, given its measured advance — the fallback layout should
 * `TextPath` ever prove unreliable. Unused while it is not.
 */
export function resolveGlyphAngles(
	advances: readonly number[],
	radius: number,
	startAngle: number,
	direction: CircularTextDirection
): readonly number[] {
	const sign = direction === "clockwise" ? 1 : -1;
	const angles: number[] = [];
	let travelled = 0;
	for (const advance of advances) {
		angles.push(startAngle + sign * (travelled / radius) * (180 / Math.PI));
		travelled += advance;
	}
	return angles;
}

/** Where a glyph at `angle` sits, and how far it turns to stand on the circle. */
export function resolveGlyphPosition(
	angle: number,
	radius: number,
	cx: number,
	cy: number
): { x: number; y: number; rotation: number } {
	const radians = (angle * Math.PI) / 180;
	return { x: cx + radius * Math.sin(radians), y: cy - radius * Math.cos(radians), rotation: angle };
}

/** Why a ring cannot be drawn, or `null` when it can. */
export function resolveCircularTextIssue(radius: number, text: string): string | null {
	if (!(radius > 0)) return `CircularText needs a positive radius; got ${radius}.`;
	if (text.trim().length === 0) return "CircularText needs some text to draw.";
	return null;
}
