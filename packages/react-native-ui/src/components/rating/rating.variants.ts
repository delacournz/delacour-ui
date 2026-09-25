import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { TextSize } from "../text/text.variants";

/** What a filled star means. Slider's set, reusing tokens the theme already has. */
export const RATING_COLORS = ["default", "primary", "success", "warning", "destructive", "info"] as const;

export const RATING_SIZES = ["sm", "md", "lg"] as const;

export type RatingColor = (typeof RATING_COLORS)[number];
export type RatingSize = (typeof RATING_SIZES)[number];

/**
 * The axes a rating falls back to when nothing names one.
 *
 * Named once because two places read them — `defaultVariants` below and
 * {@link resolveRatingAxes}, which runs before `tv` is ever called. A test pins
 * the pair.
 *
 * `warning` rather than `default` because a star is read as amber before it is
 * read as a star: a row of ink-coloured stars looks like a set of icons, not a
 * score.
 */
export const RATING_DEFAULT_COLOR: RatingColor = "warning";
export const RATING_DEFAULT_SIZE: RatingSize = "md";

/** How many stars a rating draws when the caller names no count. */
export const RATING_COUNT = 5;

/** The increment a rating snaps to when the caller names none. `0.5` is half stars. */
export const RATING_STEP = 1;

/**
 * How far a touch may travel and still count as a tap, in points.
 *
 * Only `allowClear` reads it: a tap on the current value clears the rating, and a
 * drag that wanders off and comes back to the same star must not.
 */
export const RATING_TAP_SLOP = 6;

/**
 * How strongly an empty star is painted, as a fill opacity.
 *
 * An empty star is `muted-foreground` at this opacity rather than a token of its
 * own. No token in the set sits where it needs to: `border` and `input` vanish
 * against a light card, and `muted-foreground` at full strength reads as a
 * disabled *filled* star. A fraction of it is legible on both themes, and the
 * package has no token to add for one component's empty state (rule 11).
 */
export const RATING_EMPTY_OPACITY = 0.4;

/**
 * The token each colour fills a star with.
 *
 * A record rather than a class because the star is an SVG path, and a path's
 * `fill` is a paint prop that no `className` reaches without wrapping `Svg` in
 * `withUniwind` — which rule 7 forbids. `useThemeColor` reads the raw name.
 */
export const RATING_FILL_TOKEN: Record<RatingColor, string> = {
	default: "foreground",
	primary: "primary",
	success: "success",
	warning: "warning",
	destructive: "destructive",
	info: "info",
};

/** The token an empty star is painted with, at {@link RATING_EMPTY_OPACITY}. */
const RATING_EMPTY_TOKEN = "muted-foreground";

/**
 * The `Text` size step each rating size hands its output.
 *
 * `Rating.Output` renders `Text.Label` and names this step rather than restating
 * a type scale — the weight and colour stay in the preset. A test asserts every
 * value here is a size `Text` actually has.
 */
export const RATING_OUTPUT_TEXT_SIZE: Record<RatingSize, TextSize> = { sm: "sm", md: "md", lg: "lg" };

/**
 * One star, as a path in a 24-point box.
 *
 * Ten vertices at a 0.42 inner-to-outer ratio, centred a little low so the two
 * lower points and the upper one sit at the same distance from the box's edge.
 * The glyph is drawn with a round-joined stroke in its own fill colour, which is
 * what softens the points to match Central Icons' rounded set without a curve in
 * the path.
 *
 * Drawn here rather than taken from the icon set because the set is outlined:
 * a filled star, and the clipped half of one, has no glyph there to draw.
 */
export const RATING_STAR_PATH =
	"M12 2.3L14.65 9.26L22.08 9.62L16.28 14.29L18.23 21.48L12 17.4L5.77 21.48L7.72 14.29L1.92 9.62L9.35 9.26Z";

/** The stroke that rounds the star's points, in the path's own 24-point units. */
export const RATING_STAR_STROKE = 1.5;

/**
 * Styling for every part of a rating.
 *
 * One slotted `tv()` rather than a call per part, because `rating-stars.tsx`,
 * `rating-star.tsx` and `rating-output.tsx` cannot import the root without
 * closing a cycle (AGENTS.md rule 3) yet all three read the same `size`.
 *
 * **The glyph is a step on the icon scale**, not a number of its own: `sm`, `md`
 * and `lg` are `icon-lg`, `icon-xl` and `icon-2xl`. A star is a mark, the way a
 * checkbox's tick is, and sits on the scale every other mark in the package does.
 *
 * **The row is the touch target, padded on the cross axis only.** The glyph and
 * that padding sum to 44 at every size, and a test asserts the sum. The main
 * axis is left unpadded because the value is read straight off the touch's
 * offset along the row — a gutter there would put every value off by it.
 *
 * **Each star sits in a cell that carries the gap**, as padding on both sides,
 * so every cell is the same width and a star's half is the half of its cell. A
 * `gap-*` on the row would leave dead space between the cells that belongs to no
 * star, and a touch there would have to be assigned somewhere by a rule nobody
 * could see.
 *
 * **The colour is not here.** A star is an SVG path, and its fill is a paint prop
 * — see {@link RATING_FILL_TOKEN} and {@link resolveRatingPaint}.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const ratingVariants = tv({
	slots: {
		/** The column holding the stars and the readout. */
		root: "items-start gap-1",
		/** The row of stars, and the surface the drag is claimed on. */
		stars: "flex-row items-center self-start",
		/** One star's share of the row: its glyph plus half the gap either side. */
		cell: "items-center justify-center",
		/** The glyph's box. The empty star fills it; the clip overlays it. */
		glyph: "relative",
		/** The filled star's window. Its width is the star's fill, as a percentage. */
		clip: "absolute bottom-0 left-0 top-0 overflow-hidden",
		/** Handed to a `Text.Label`. Layout only. */
		output: "",
	},
	variants: {
		size: {
			sm: { stars: "py-3", cell: "px-0.5", glyph: "size-icon-lg" },
			md: { stars: "py-2.5", cell: "px-1", glyph: "size-icon-xl" },
			lg: { stars: "py-1.5", cell: "px-1", glyph: "size-icon-2xl" },
		},
		isDisabled: { true: { root: "opacity-50" }, false: {} },
	},
	defaultVariants: {
		size: RATING_DEFAULT_SIZE,
		isDisabled: false,
	},
});

/**
 * A star count the row can draw.
 *
 * A positive whole number passes through and a fraction rounds **down** — a
 * count of 4.9 is four stars, because a fifth star that can only be part-filled
 * is not a star anyone asked for. Anything that is not a count at all — zero,
 * negative, non-finite, below one after rounding — falls back to
 * {@link RATING_COUNT} rather than drawing nothing, since a rating with no stars
 * has no way to say so.
 */
export function normalizeRatingCount(count: number | undefined): number {
	if (count === undefined || !Number.isFinite(count)) return RATING_COUNT;
	const whole = Math.floor(count);
	return whole >= 1 ? whole : RATING_COUNT;
}

/**
 * A step the stars can land on.
 *
 * It has to divide one star: 0.5 and 0.25 do, 0.3 and 0.4 do not, and a step
 * that does not would leave a star whose last stop is somewhere short of full.
 * Anything else — past one star, zero, negative, non-finite — falls back to
 * whole stars rather than throwing, because a rating is usually fed from a
 * server that got the number from somewhere.
 */
export function normalizeRatingStep(step: number | undefined): number {
	if (step === undefined || !Number.isFinite(step) || step <= 0 || step > 1) return RATING_STEP;
	const divisions = 1 / step;
	return Math.abs(divisions - Math.round(divisions)) < 1e-9 ? step : RATING_STEP;
}

/**
 * The value held inside zero and the count.
 *
 * It does **not** snap. `step` constrains what a finger can set; a read-only
 * average of 3.7 is drawn at 3.7. A non-finite value is zero, because a star
 * whose width came out of `NaN` is a star that is not drawn and a row that lies.
 */
export function clampRating(value: number, count: number): number {
	if (!Number.isFinite(value)) return 0;
	return value < 0 ? 0 : value > count ? count : value;
}

/**
 * How much of the star at `index` is filled, as 0–1.
 *
 * Every star before the value is full, every star after it empty, and the one
 * the value lands inside takes the remainder — so the fills always sum back to
 * the value, which is what a test asserts.
 */
export function starFillOf(index: number, value: number): number {
	const fill = value - index;
	return fill < 0 ? 0 : fill > 1 ? 1 : fill;
}

/**
 * The value a touch at `position` points at.
 *
 * `position` is the touch's offset along the row, `width` the row's own measured
 * width, and every star owns an equal cell of it. The value rounds **up** to the
 * next stop, so any touch inside a star's cell takes that star — with half stars,
 * its left half is the half and its right half the whole. Ending exactly on a
 * cell edge belongs to the star before it, not a sliver of the next.
 *
 * A drag past the start holds the lowest stop rather than clearing. Clearing is
 * a separate, deliberate gesture — see {@link shouldClearRating} — because a drag
 * that overshoots the first star is someone rating one, not someone withdrawing.
 *
 * `width <= 0` is **not measured yet**, and reports zero rather than dividing.
 */
export function ratingFromOffset({
	position,
	width,
	count,
	step,
}: {
	position: number;
	width: number;
	count: number;
	step: number;
}): number {
	"worklet";
	if (width <= 0 || count <= 0 || step <= 0) return 0;

	const raw = (position / width) * count;
	const clamped = raw < 0 ? 0 : raw > count ? count : raw;
	// The epsilon keeps a touch exactly on a stop from rounding up a whole step
	// past it, which is where `Math.ceil` and binary floating point disagree.
	const snapped = Math.ceil(clamped / step - 1e-9) * step;
	const bounded = snapped < step ? step : snapped > count ? count : snapped;

	return Math.round(bounded * 1e10) / 1e10;
}

/**
 * One assistive increment or decrement from `value`.
 *
 * A value between stops — a read-only 3.7 made interactive — lands on the
 * **next** stop in the direction asked rather than a whole step past it, so an
 * increment from 3.7 in whole stars is 4, not 4.7 clamped to 5.
 */
export function stepRating(value: number, direction: 1 | -1, step: number, count: number): number {
	const stops = value / step;
	const onStop = Math.abs(stops - Math.round(stops)) < 1e-9;
	const base = onStop ? Math.round(stops) : direction > 0 ? Math.floor(stops) : Math.ceil(stops);
	const next = (base + direction) * step;
	const bounded = next < 0 ? 0 : next > count ? count : next;

	return Math.round(bounded * 1e10) / 1e10;
}

/**
 * Whether a gesture that has just ended should clear the rating.
 *
 * Only a **tap**, only on the **value already held**, and only when the caller
 * asked for it. A drag that wanders off and comes back to where it started is a
 * drag — reading `travel` is what tells them apart. A rating already at zero has
 * nothing to clear.
 */
export function shouldClearRating({
	allowClear,
	startValue,
	touchedValue,
	travel,
}: {
	allowClear: boolean;
	startValue: number;
	touchedValue: number;
	travel: number;
}): boolean {
	"worklet";
	if (!allowClear || startValue <= 0) return false;
	if (travel > RATING_TAP_SLOP) return false;
	return touchedValue === startValue;
}

/**
 * The value as a readout: no decimals for a whole value, at most two otherwise.
 *
 * JS-thread only — `Intl` is not available to a worklet.
 */
export function formatRatingValue(value: number): string {
	return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

/** What a screen reader says for the value: "3.5 out of 5". */
export function describeRating(value: number, count: number): string {
	return `${formatRatingValue(value)} out of ${count}`;
}

/** The two tokens a rating's stars are painted with. */
export type RatingPaint = { fill: string; empty: string };

/**
 * Which tokens paint the filled and the empty stars.
 *
 * **An empty star is the same chrome at every colour**, the way an empty slider
 * groove is — a test asserts that. **Invalid outranks the colour, on both**: a
 * required rating left at zero has no filled star to turn red, so the empty
 * outlines have to carry the signal or there is none.
 */
export function resolveRatingPaint({ color, isInvalid }: { color: RatingColor; isInvalid: boolean }): RatingPaint {
	if (isInvalid) return { fill: "destructive", empty: "destructive" };
	return { fill: RATING_FILL_TOKEN[color], empty: RATING_EMPTY_TOKEN };
}

/** What a rating was given at its own call site. */
export type RatingOwnAxes = {
	color?: RatingColor;
	size?: RatingSize;
	isDisabled?: boolean;
	isInvalid?: boolean;
	isReadOnly?: boolean;
};

/** What an enclosing `Field` publishes, or null outside one. */
export type RatingFieldAxes = { isDisabled?: boolean; isInvalid?: boolean };

/** Every axis settled, ready to hand to {@link ratingVariants} and to context. */
export type RatingAxes = Required<RatingOwnAxes>;

/**
 * Settles a rating's axes from the two places they can come from.
 *
 * The same two-rung ladder `Slider` runs: the rating's own props, then an
 * enclosing `Field`, with `??` throughout so an explicit `false` is a value.
 * A `Field` reaches the two *state* axes only. `isReadOnly` is the rating's own:
 * a field has no notion of it, and a form that shows a score it will not let
 * you change says so at the control.
 */
export function resolveRatingAxes({ own, field }: { own?: RatingOwnAxes; field?: RatingFieldAxes | null }): RatingAxes {
	return {
		color: own?.color ?? RATING_DEFAULT_COLOR,
		size: own?.size ?? RATING_DEFAULT_SIZE,
		isDisabled: own?.isDisabled ?? field?.isDisabled ?? false,
		isInvalid: own?.isInvalid ?? field?.isInvalid ?? false,
		isReadOnly: own?.isReadOnly ?? false,
	};
}

export type RatingVariantProps = VariantProps<typeof ratingVariants>;
