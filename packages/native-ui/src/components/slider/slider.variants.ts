import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { TextSize } from "../text/text.variants";

/** What a filled track means. Badge's and Checkbox's set, reusing tokens the theme already has. */
export const SLIDER_COLORS = ["default", "primary", "success", "warning", "danger", "info"] as const;

export const SLIDER_SIZES = ["sm", "md", "lg"] as const;

/** Which way the track runs. A `vertical` slider counts up from the bottom. */
export const SLIDER_ORIENTATIONS = ["horizontal", "vertical"] as const;

export type SliderColor = (typeof SLIDER_COLORS)[number];
export type SliderSize = (typeof SLIDER_SIZES)[number];
export type SliderOrientation = (typeof SLIDER_ORIENTATIONS)[number];

/**
 * The axes a slider falls back to when nothing names one.
 *
 * Named once because two places read them — `defaultVariants` below and
 * {@link resolveSliderAxes}, which runs before `tv` is ever called. A test pins
 * the pair, since a drift between them is a slider that renders at one size and
 * reports another.
 */
export const SLIDER_DEFAULT_COLOR: SliderColor = "default";
export const SLIDER_DEFAULT_SIZE: SliderSize = "md";
export const SLIDER_DEFAULT_ORIENTATION: SliderOrientation = "horizontal";

/** The range a slider covers when the caller names none. */
export const SLIDER_MIN_VALUE = 0;
export const SLIDER_MAX_VALUE = 100;

/** The increment a slider snaps to when the caller names none. `0` is continuous. */
export const SLIDER_STEP = 1;

/**
 * The spring the grabbed thumb grows on.
 *
 * Deliberately `Pressable`'s own `PRESS_SPRING`: a thumb responding to a touch is
 * the same event as a button responding to one, and two springs a frame apart
 * would read as two things happening.
 */
export const SLIDER_THUMB_SPRING = { damping: 18, mass: 0.4, stiffness: 320 } as const;

/**
 * How far the grabbed thumb travels on the scale axis.
 *
 * It **grows**, where every other pressable in this library shrinks. A button
 * stays under the finger that pressed it, so shrinking reads as give; a slider's
 * thumb travels out from under the finger the moment the drag starts, and a thumb
 * that shrank as it disappeared under a fingertip would leave nothing to aim at.
 */
export const SLIDER_THUMB_ANIMATION = { restScale: 1, grabbedScale: 1.15 } as const;

/**
 * The `Text` size step each slider size hands its output.
 *
 * `Slider.Output` renders `Text.Label` and names this step rather than restating a
 * type scale in the `output` slot. `Text`'s own size axis is built to beat its
 * preset, so the weight and the colour stay in exactly one place — the preset —
 * while the readout still tracks the slider's size. A test asserts every value
 * here is a size `Text` actually has.
 */
export const SLIDER_OUTPUT_TEXT_SIZE: Record<SliderSize, TextSize> = { sm: "sm", md: "md", lg: "lg" };

/**
 * How far a drag must travel between two haptic ticks, in points.
 *
 * A pan updates at the display's refresh rate, so "tick whenever the snapped
 * value changed" is not a rate limit on its own: 0–100 in whole steps across a
 * 300pt track is a step every three points, and a flick crosses a hundred of them
 * in a fifth of a second. That is not a hundred ticks, it is a buzz — and a
 * hundred synchronous calls into the haptic engine to produce it.
 *
 * Gating on distance rather than on a clock keeps the rule pure, so `bun test`
 * reaches it, and makes it degrade the right way: a coarse step scale ticks on
 * every stop, and a fine one thins out to a cadence a hand can actually feel.
 */
export const SLIDER_HAPTIC_MIN_TRAVEL = 6;

/**
 * What sits between the two ends of a range in `Slider.Output`.
 *
 * An en dash, not a hyphen. A hyphen beside a negative number reads as arithmetic
 * — `-20 - -5` — and a range is exactly the case where that happens.
 */
export const SLIDER_RANGE_SEPARATOR = " – ";

/**
 * Styling for every part of a slider.
 *
 * One slotted `tv()` rather than a call per part, because `slider-track.tsx`,
 * `slider-fill.tsx` and `slider-thumb.tsx` cannot import the root without closing
 * a cycle (AGENTS.md rule 3) yet all three read the same `color`, `size` and
 * `orientation`.
 *
 * **The colour paints the fill and nothing else.** An empty track is the same
 * chrome at every colour, the way an unticked checkbox is `border-input bg-card`
 * however it is coloured — so the colour axis has one slot to paint rather than a
 * matrix, and a test asserts the track and the thumb really do not move with it.
 *
 * **`default` and `primary` name different tokens that this theme tunes to the
 * same value.** `foreground` is the page's ink and `primary` is the brand's
 * action colour; they are `#262626` in both roles today, which is the situation
 * `Badge` already documents for its neutral end. Modelling them as one token
 * would be the drift, not the duplication: an app that re-themes `primary` to
 * blue wants `color="primary"` blue and `color="default"` still ink.
 *
 * **The thumb takes a border, never a shadow.** Nothing else in this package
 * draws one, and React Native's shadow props diverge between platforms in a way a
 * one-pixel border does not — a test pins that absence across the whole matrix.
 * The ring is `border-input` rather than `border-border`: it is the chrome of a
 * *control*, the same token a resting checkbox wears, and it needs to hold its
 * edge against the groove behind it. `border-border` is a divider's weight and
 * disappears into `bg-secondary` in light mode.
 *
 * **The thumb's diameter is the track's thickness**, and that is load-bearing
 * rather than decorative. It is what lets {@link fillExtent} land exactly on both
 * extremes — one thumb's width of fill at the minimum, the track's full length at
 * the maximum — with no inset to leave stray colour at one end and empty groove at
 * the other. One step per size therefore drives both, and a test asserts the two
 * classes name the same one. It is a plain spacing step and not a token: this is
 * one number read in one component, the trade `Radio` already makes for the dot
 * inside its ring. `Checkbox` reads `--spacing-icon-*` for its square and should
 * keep doing so — a glyph in a box is a mark on the icon scale, where a slider's
 * thumb is the body of the control itself.
 *
 * **The groove is not the touch target on its own.** A `sm` track is sixteen
 * points, so the drag is claimed on a transparent `touchArea` whose padding brings
 * it up to 44. The thickness and that padding live in the *same* compound cell
 * because they are one number — they sum to 44 at every size, and a test asserts
 * the sum rather than the parts. Split across two variants, a retune of the
 * thickness silently shrinks the target.
 *
 * That padding is on the **cross axis only**. The two boxes therefore share an
 * origin along the axis the value is measured on, which is what lets the pan read
 * its offset straight off the touch without correcting for a gutter it cannot see.
 * Pad the main axis and every value is wrong by the padding, silently, and
 * visibly only at the ends.
 *
 * **The track still centres the thumb, and now has nothing to centre.** An
 * absolutely-positioned child with no cross-axis inset is placed at the static
 * position the parent's `items-center` decides — which did the work when the thumb
 * overhung a hairline groove, and is a no-op now that the two are the same size.
 * It stays because the moment those sizes are allowed to differ it is load-bearing
 * again, and because it is why the track is `flex-row` when horizontal:
 * `items-center` centres on the *cross* axis, and a column track would centre the
 * wrong one.
 *
 * **The fade lands on the root**, which is a plain `View` here rather than a
 * `Pressable` — so unlike `Radio`, an `opacity-50` class on it is not overwritten
 * by an animated style writing `opacity` every frame.
 *
 * No slot worn by a `View` carries `text-*` or `font-*`: `Slider.Output` renders
 * a `Text` preset and names a step — see {@link SLIDER_OUTPUT_TEXT_SIZE}.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot parse
 * React Native's Flow-typed source. See AGENTS.md.
 */
export const sliderVariants = tv({
	slots: {
		/** The column holding the readout and the track. */
		root: "",
		/** Handed to a `Text.Label`. Layout only, and today there is none. */
		output: "",
		/** The transparent box the drag is claimed on. Padded on the cross axis only. */
		touchArea: "items-center justify-center",
		/** The groove. Positions the fill and the thumbs inside it. */
		track: "relative items-center rounded-full bg-secondary",
		/** The painted part of the groove. Its extent is an animated style, never a class. */
		fill: "absolute rounded-full",
		/** The grab handle. Its position and its scale are one animated style. */
		thumb: "absolute rounded-full border border-input bg-background",
	},
	variants: {
		orientation: {
			horizontal: {
				root: "w-full gap-2",
				touchArea: "w-full flex-row",
				track: "w-full flex-row",
				fill: "bottom-0 top-0",
				thumb: "left-0",
			},
			vertical: {
				root: "h-full items-center gap-2",
				touchArea: "h-full flex-col",
				track: "h-full justify-end",
				fill: "left-0 right-0",
				thumb: "bottom-0",
			},
		},
		size: {
			sm: { thumb: "size-4" },
			md: { thumb: "size-5" },
			lg: { thumb: "size-6" },
		},
		// The empty branches are load-bearing typing, not placeholders. `tv` derives
		// the prop type from the declared keys, so a map with only `true` types the
		// prop as `true` rather than `boolean`.
		color: { default: {}, primary: {}, success: {}, warning: {}, danger: {}, info: {} },
		isInvalid: { true: {}, false: {} },
		isDisabled: { true: { root: "opacity-50" }, false: {} },
	},
	compoundVariants: [
		// The groove's thickness is the one measurement that has to know the
		// orientation, because it is the *cross* axis of whichever way the track
		// runs. Six cells rather than a second size scale, so the two orientations
		// cannot drift to different weights.
		//
		// The touch padding rides in the same cell, because the two are one number:
		// they sum to 44pt at every size, and splitting them across two variants is
		// how a retune of the thickness silently shrinks the target.
		{ orientation: "horizontal", size: "sm", class: { track: "h-4", touchArea: "py-3.5" } },
		{ orientation: "horizontal", size: "md", class: { track: "h-5", touchArea: "py-3" } },
		{ orientation: "horizontal", size: "lg", class: { track: "h-6", touchArea: "py-2.5" } },
		{ orientation: "vertical", size: "sm", class: { track: "w-4", touchArea: "px-3.5" } },
		{ orientation: "vertical", size: "md", class: { track: "w-5", touchArea: "px-3" } },
		{ orientation: "vertical", size: "lg", class: { track: "w-6", touchArea: "px-2.5" } },
		// `color` is the only axis painting the fill, so its six cells could be a
		// plain variant. They are compounds so that `isInvalid` below, emitted after
		// them, can beat every one — the ordering `Radio` leans on for its ring.
		{ color: "default", class: { fill: "bg-foreground" } },
		{ color: "primary", class: { fill: "bg-primary" } },
		{ color: "success", class: { fill: "bg-success" } },
		{ color: "warning", class: { fill: "bg-warning" } },
		{ color: "danger", class: { fill: "bg-danger" } },
		{ color: "info", class: { fill: "bg-info" } },
		// Invalid outranks the colour, the way it does on a checkbox's border. A
		// slider that stayed green while its value was rejected would drop its only
		// signal exactly while the value is being corrected.
		{ isInvalid: true, class: { fill: "bg-danger" } },
	],
	defaultVariants: {
		color: SLIDER_DEFAULT_COLOR,
		size: SLIDER_DEFAULT_SIZE,
		orientation: SLIDER_DEFAULT_ORIENTATION,
		isInvalid: false,
		isDisabled: false,
	},
});

/**
 * The caller's value, as the array every part reads.
 *
 * Always a copy: the array is handed to a shared value and written on the UI
 * thread, and aliasing the caller's own would mutate state they still hold.
 */
export function toValueArray(value: number | number[]): number[] {
	"worklet";
	return Array.isArray(value) ? [...value] : [value];
}

/**
 * The array, back in the shape the caller passed in.
 *
 * A slider given a number reports a number; one given an array reports an array.
 * `isRange` is locked on first render rather than sniffed per call — see
 * `slider.tsx` — so the shape a caller receives never changes under them.
 */
export function fromValueArray(values: readonly number[], isRange: boolean): number | number[] {
	if (isRange) return [...values];
	return values[0] ?? 0;
}

/**
 * Where a value sits on the track, as 0–1.
 *
 * Clamped rather than extrapolated, and `0` for a degenerate range — a slider
 * whose minimum equals its maximum has one position, and dividing by the
 * difference would put `NaN` into a shared value and freeze the thumb for good.
 */
export function progressOf(value: number, minValue: number, maxValue: number): number {
	"worklet";
	const span = maxValue - minValue;
	if (span <= 0) return 0;
	const ratio = (value - minValue) / span;
	return ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
}

/**
 * The nearest reachable value, measured in steps **from the minimum**.
 *
 * Not from zero: a slider from 5 to 100 in tens reaches 5, 15, 25 — the stops a
 * caller can actually land on — rather than 10, 20, 30 with an unreachable 5 at
 * the end.
 *
 * **Both ends are always stops, even when the step does not divide the range.**
 * 0–100 by 7 reaches 0, 7, 14 … 98 and then 100, because a slider whose maximum
 * cannot be reached by dragging all the way to the end is a slider that lies about
 * its own range — the caller wrote `maxValue`, and the last two points of travel
 * are not where they get told it was unreachable. A tie goes to the regular stop,
 * so the extra one only ever appears at the very end of the drag.
 *
 * `step <= 0` means continuous and passes the clamped value through.
 *
 * The final rounding kills binary floating-point noise: ten steps of `0.1` land on
 * `0.30000000000000004` without it, which a formatted readout shows in full.
 */
export function snapToStep(value: number, step: number, minValue: number, maxValue: number): number {
	"worklet";
	const clamped = value < minValue ? minValue : value > maxValue ? maxValue : value;
	if (step <= 0) return clamped;

	const snapped = minValue + Math.round((clamped - minValue) / step) * step;
	const bounded = snapped < minValue ? minValue : snapped > maxValue ? maxValue : snapped;
	const rounded = Math.round(bounded * 1e10) / 1e10;

	return Math.abs(clamped - maxValue) < Math.abs(clamped - rounded) ? maxValue : rounded;
}

/**
 * One thumb's value, held inside the range and inside its own neighbours.
 *
 * The outer thumbs are bounded by the range; an inner one by the thumbs either
 * side of it. This is the whole of what makes a range a range — without it a drag
 * past a neighbour reorders the values and the fill inverts.
 */
export function clampThumb(
	value: number,
	values: readonly number[],
	index: number,
	minValue: number,
	maxValue: number
): number {
	"worklet";
	const lower = index > 0 ? (values[index - 1] ?? minValue) : minValue;
	const upper = index < values.length - 1 ? (values[index + 1] ?? maxValue) : maxValue;
	const floor = lower < minValue ? minValue : lower;
	const ceiling = upper > maxValue ? maxValue : upper;
	return value < floor ? floor : value > ceiling ? ceiling : value;
}

/**
 * The value a touch at `position` points at.
 *
 * `position` is the touch's offset along the track with the thumb's own half-width
 * already taken off, and `travel` is what the thumb's leading edge can cover —
 * `trackSize - thumbSize`. Working in the thumb's own frame is what keeps the
 * handle inside the groove at both ends instead of overhanging them.
 *
 * **A vertical track is inverted here**, and in exactly one other place — the sign
 * of the thumb's translate. A touch offset is measured from the top and a vertical
 * slider counts up from the bottom, so one of the two has to turn around, and one
 * place deciding it is what keeps them agreeing.
 *
 * `travel <= 0` returns the minimum rather than dividing: the track reports its
 * size on layout, so every frame before the first one has nothing to divide by.
 */
export function valueFromOffset({
	position,
	travel,
	minValue,
	maxValue,
	isVertical,
}: {
	position: number;
	travel: number;
	minValue: number;
	maxValue: number;
	isVertical: boolean;
}): number {
	"worklet";
	if (travel <= 0) return minValue;

	const raw = position / travel;
	const oriented = isVertical ? 1 - raw : raw;
	const ratio = oriented < 0 ? 0 : oriented > 1 ? 1 : oriented;
	return minValue + ratio * (maxValue - minValue);
}

/**
 * Which thumb a touch grabs.
 *
 * A tie resolves to the lower index, and it has to resolve to *something* fixed:
 * pressing the exact midpoint between two thumbs is a real gesture, and which one
 * moves must not depend on iteration order changing under a refactor.
 */
export function nearestThumbIndex(values: readonly number[], target: number): number {
	"worklet";
	let nearest = 0;
	let shortest = Number.POSITIVE_INFINITY;

	for (let index = 0; index < values.length; index++) {
		const distance = Math.abs((values[index] ?? 0) - target);
		if (distance < shortest) {
			shortest = distance;
			nearest = index;
		}
	}

	return nearest;
}

/**
 * The stretch of track the fill covers, as two 0–1 positions.
 *
 * A lone thumb fills from the minimum, because that is what a single value means:
 * how far along. A range fills *between* its own thumbs, because the ends are what
 * the caller excluded.
 *
 * The outermost thumbs are taken by value rather than by index, so a caller who
 * hands over a descending array still gets a fill with a positive extent instead
 * of one drawn backwards. The drag itself keeps them in order — see
 * {@link clampThumb} — but the first render happens before any drag.
 */
export function fillBounds(
	values: readonly number[],
	minValue: number,
	maxValue: number
): { start: number; end: number } {
	"worklet";
	const span = maxValue - minValue;
	if (values.length === 0 || span <= 0) return { start: 0, end: 0 };

	let lowest = values[0] ?? minValue;
	let highest = lowest;
	for (const value of values) {
		if (value < lowest) lowest = value;
		if (value > highest) highest = value;
	}

	// The progress maths is written out rather than calling `progressOf`. A
	// module-scope worklet calling another one binds its closure once, at module
	// init, in source order — so the pair works only while the callee happens to be
	// declared first, and a tidy-up that reorders the file crashes the UI thread
	// with `undefined is not a function`. Every exported worklet here stays flat,
	// which is the conclusion `screen.variants.ts` reached the hard way.
	const start = values.length > 1 ? Math.min(Math.max((lowest - minValue) / span, 0), 1) : 0;
	const end = Math.min(Math.max((highest - minValue) / span, 0), 1);

	return { start, end: Math.max(start, end) };
}

/**
 * The fill's box in points: where it starts along the track, and how long it is.
 *
 * Takes {@link fillBounds}' two 0–1 positions into the track's own frame. It is a
 * function rather than four lines inside `slider-fill.tsx` because the property it
 * encodes is not self-evident and is the whole reason the thumb is drawn the size
 * it is — a `+ thumbSize` at the far end, which lands exactly on both extremes:
 *
 * - at the **minimum** the extent is one thumb, so the handle covers the fill
 *   completely and a slider at rest shows a plain track;
 * - at the **maximum** the extent is `travel + thumbSize`, the track's full
 *   length, with no sliver of empty groove past the handle;
 * - a **collapsed range** is one thumb wide rather than zero, so the fill does not
 *   blink out from under two thumbs dragged together.
 *
 * All three hold only because the thumb's diameter equals the track's thickness.
 * Inset the thumb inside the track and every one of them is off by the inset — a
 * few points of stray colour at one end and of empty groove at the other, at every
 * size. This is the arithmetic that pays for that proportion, so it is the
 * arithmetic `bun test` has to be able to reach.
 *
 * It replaced a `+ thumbSize / 2`, which stopped the fill at the thumb's *centre*.
 * That was correct but invisible while a large disc overhung a hairline groove; it
 * would now leave the last half-thumb of the bar unfilled, in plain view.
 *
 * `travel <= 0` draws nothing: a measured `0` means *not measured yet*, and a bar
 * sized off it would flash at a garbage length on the frame before layout lands.
 */
export function fillExtent({
	start,
	end,
	travel,
	thumbSize,
	isRange,
}: {
	start: number;
	end: number;
	travel: number;
	thumbSize: number;
	isRange: boolean;
}): { offset: number; extent: number } {
	"worklet";
	if (travel <= 0) return { offset: 0, extent: 0 };

	const from = isRange ? Math.min(Math.max(start, 0), 1) : 0;
	const to = Math.min(Math.max(end, 0), 1);
	const offset = from * travel;
	const extent = Math.max(to * travel + thumbSize - offset, thumbSize);

	return { offset, extent };
}

/**
 * The values as one readable string.
 *
 * JS-thread only — `Intl` is not available to a worklet, which is the reason
 * `Slider.Output` reads React state rather than the shared value the thumb reads.
 */
export function formatSliderValue(values: readonly number[], formatOptions?: Intl.NumberFormatOptions): string {
	if (values.length === 0) return "";
	const format = new Intl.NumberFormat(undefined, formatOptions);
	return values.map((value) => format.format(value)).join(SLIDER_RANGE_SEPARATOR);
}

/**
 * Whether crossing into `snapped` should tick.
 *
 * Four rules, in order:
 *
 * - a **continuous** slider never ticks. There is no stop to land on, so a tick
 *   would be reporting the refresh rate rather than the value.
 * - a value that did not change does not tick.
 * - either **end of the range** always ticks, however fast the drag arrived. It
 *   is the one moment a slider has something to say that the screen does not
 *   already show — the thumb has stopped and the finger has not.
 * - otherwise the drag must have travelled {@link SLIDER_HAPTIC_MIN_TRAVEL}
 *   points since the last tick.
 *
 * Pure, so the whole ladder is reachable from `bun test`, and flat, so it is safe
 * to call from the pan's worklet. See AGENTS.md.
 */
export function shouldTickHaptic({
	step,
	snapped,
	lastSnapped,
	position,
	lastPosition,
	minValue,
	maxValue,
}: {
	step: number;
	snapped: number;
	lastSnapped: number;
	position: number;
	lastPosition: number;
	minValue: number;
	maxValue: number;
}): boolean {
	"worklet";
	if (step <= 0) return false;
	if (snapped === lastSnapped) return false;
	if (snapped === minValue || snapped === maxValue) return true;
	return Math.abs(position - lastPosition) >= SLIDER_HAPTIC_MIN_TRAVEL;
}

/** What a slider was given at its own call site. */
export type SliderOwnAxes = {
	color?: SliderColor;
	size?: SliderSize;
	orientation?: SliderOrientation;
	isDisabled?: boolean;
	isInvalid?: boolean;
};

/** What an enclosing `Field` publishes, or null outside one. */
export type SliderFieldAxes = { isDisabled?: boolean; isInvalid?: boolean };

/** Every axis settled, ready to hand to {@link sliderVariants} and to context. */
export type SliderAxes = Required<SliderOwnAxes>;

/**
 * Settles a slider's axes from the two places they can come from.
 *
 * There is no `Slider.Group`, so the ladder is two rungs rather than three: the
 * slider's own props, then an enclosing `Field`. A slider inside `<Field isDisabled>`
 * dims with nothing said at the call site, and `isDisabled={false}` opts that one
 * out — `??` throughout and never `||`, so an explicit `false` is a value rather
 * than an absence.
 *
 * A `Field` reaches the two *state* axes only. It carries no colour, size or
 * orientation, and a test pins that it cannot acquire one by accident.
 *
 * Pure, so the whole matrix is reachable from `bun test`. See AGENTS.md.
 */
export function resolveSliderAxes({ own, field }: { own?: SliderOwnAxes; field?: SliderFieldAxes | null }): SliderAxes {
	return {
		color: own?.color ?? SLIDER_DEFAULT_COLOR,
		size: own?.size ?? SLIDER_DEFAULT_SIZE,
		orientation: own?.orientation ?? SLIDER_DEFAULT_ORIENTATION,
		isDisabled: own?.isDisabled ?? field?.isDisabled ?? false,
		isInvalid: own?.isInvalid ?? field?.isInvalid ?? false,
	};
}

export type SliderVariantProps = VariantProps<typeof sliderVariants>;
