import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ICON_SIZES } from "../icon/icon.variants";
import {
	hasThumbChild,
	resolveSwitchAxes,
	resolveSwitchContentTreatment,
	resolveSwitchRelease,
	resolveSwitchThumbTokens,
	resolveSwitchTrackTokens,
	SWITCH_COLORS,
	SWITCH_CONTENT_ICON_STEP,
	SWITCH_CONTENT_REST_TEXT_CLASS,
	SWITCH_CONTENT_REST_TOKEN,
	SWITCH_CONTENT_TEXT_CLASS,
	SWITCH_DEFAULT_COLOR,
	SWITCH_DEFAULT_SIZE,
	SWITCH_FLING_VELOCITY,
	SWITCH_INVALID_CONTENT_TEXT_CLASS,
	SWITCH_INVALID_THUMB_TOKEN,
	SWITCH_INVALID_TRACK_TOKEN,
	SWITCH_SIZES,
	SWITCH_TAP_SLOP,
	SWITCH_THUMB_ICON_STEP,
	SWITCH_THUMB_INSET,
	SWITCH_THUMB_REST_TOKEN,
	SWITCH_THUMB_SPRING,
	SWITCH_THUMB_TOKEN,
	SWITCH_TRACK_REST_TOKEN,
	SWITCH_TRACK_TOKEN,
	switchTravel,
	switchVariants,
} from "./switch.variants";

const TOKENS_CSS = readFileSync(join(import.meta.dirname, "../../styles/tokens.css"), "utf-8");
const THEME_CSS = readFileSync(join(import.meta.dirname, "../../styles/theme.css"), "utf-8");

/** The minimum a touch target may be, in points. Apple's number, and Android's. */
const MINIMUM_TARGET = 44;

/** Tailwind's spacing step, in points — `h-6` is six of them. */
const SPACING_STEP = 4;

/** How many times theme.css declares a `--color-*` token — once per variant, so two. */
function themeDeclarations(token: string): number {
	return THEME_CSS.match(new RegExp(`--color-${token}:`, "g"))?.length ?? 0;
}

/** A `--spacing-*` token's value in points, read from `tokens.css`. */
function spacingPx(token: string): number {
	const match = TOKENS_CSS.match(new RegExp(`--spacing-${token}:\\s*(\\d+)px`));
	if (!match) throw new Error(`tokens.css declares no --spacing-${token}`);
	return Number(match[1]);
}

/**
 * A slot's class string, with `tv`'s empty-slot `undefined` flattened.
 *
 * A slot that emits nothing returns `undefined` rather than `""` — correct, but
 * it makes a bare `not.toMatch()` throw rather than pass.
 */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** The points a `h-6` / `py-2.5` / `left-0.5` utility resolves to. */
function utilityPx(value: string, prefix: string): number {
	const match = value.match(new RegExp(`\\b${prefix}-(\\d+(?:\\.\\d+)?)\\b`));
	if (!match) throw new Error(`no \`${prefix}-*\` in "${value}"`);
	return Number(match[1]) * SPACING_STEP;
}

/** The points a `size-icon-*` utility resolves to, via `tokens.css`. */
function iconUtilityPx(value: string): number {
	const match = value.match(/\bsize-(icon-[\w-]+)\b/);
	if (!match) throw new Error(`no \`size-icon-*\` in "${value}"`);
	return spacingPx(match[1]);
}

/** Every slot for one size, disabled off. */
function slotsFor(size: (typeof SWITCH_SIZES)[number]) {
	return switchVariants({ size, isDisabled: false });
}

describe("switchVariants defaults", () => {
	test("the tv's defaults are the constants the resolver falls back to", () => {
		// A drift between the two is a switch that renders at one size and reports
		// another, which nothing on screen would reveal.
		expect(cls(switchVariants({}).track())).toBe(cls(slotsFor(SWITCH_DEFAULT_SIZE).track()));
		expect(resolveSwitchAxes({}).size).toBe(SWITCH_DEFAULT_SIZE);
		expect(resolveSwitchAxes({}).color).toBe(SWITCH_DEFAULT_COLOR);
	});
});

describe("switch geometry", () => {
	test("every thumb step is a size the icon scale actually has, and they ascend", () => {
		const steps = SWITCH_SIZES.map((size) => SWITCH_THUMB_ICON_STEP[size]);
		for (const step of steps) expect(ICON_SIZES).toContain(step);

		const points = steps.map((step) => spacingPx(`icon-${step}`));
		expect(points).toEqual([...points].sort((a, b) => a - b));
		expect(new Set(points).size).toBe(points.length);
	});

	test("every content step is a size the icon scale has, and sits below the thumb's", () => {
		for (const size of SWITCH_SIZES) {
			const step = SWITCH_CONTENT_ICON_STEP[size];
			expect(ICON_SIZES).toContain(step);
			// A glyph beside the knob, not a second knob.
			expect(spacingPx(`icon-${step}`)).toBeLessThan(spacingPx(`icon-${SWITCH_THUMB_ICON_STEP[size]}`));
		}
	});

	test("the track's height is the thumb plus twice the inset", () => {
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			const thumb = iconUtilityPx(cls(slots.thumb()));
			expect(utilityPx(cls(slots.track()), "h")).toBe(thumb + SWITCH_THUMB_INSET * 2);
		}
	});

	test("the track's width is its height plus one thumb, so the travel is one thumb", () => {
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			const track = cls(slots.track());
			const thumb = iconUtilityPx(cls(slots.thumb()));
			const height = utilityPx(track, "h");
			const width = utilityPx(track, "w");

			expect(width).toBe(height + thumb);
			expect(switchTravel({ trackWidth: width, thumbWidth: thumb, inset: SWITCH_THUMB_INSET })).toBe(thumb);
		}
	});

	test("the inset written into the slots is the constant the travel subtracts", () => {
		// The maths takes it off twice. A slot and the constant disagreeing is a
		// thumb that stops a point short of the far edge, at every size.
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			expect(utilityPx(cls(slots.thumb()), "left")).toBe(SWITCH_THUMB_INSET);
			expect(utilityPx(cls(slots.startContent()), "left")).toBe(SWITCH_THUMB_INSET);
			expect(utilityPx(cls(slots.endContent()), "right")).toBe(SWITCH_THUMB_INSET);
		}
	});

	test("the track and its touch padding sum to a real target at every size", () => {
		// The sum, not the parts, so the ladder can be retuned without the test
		// becoming a transcript of it — and so a shorter track cannot silently
		// shrink the target.
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			const height = utilityPx(cls(slots.track()), "h");
			const padding = utilityPx(cls(slots.touchArea()), "py");
			expect(height + padding * 2).toBe(MINIMUM_TARGET);
		}
	});

	test("the glyph slot is the step the map names", () => {
		// Two places name it — the slot, because Tailwind's scanner is static, and
		// the map, because the comparison below needs a value. The pin is what keeps
		// them one decision.
		for (const size of SWITCH_SIZES) {
			expect(cls(slotsFor(size).glyph())).toBe(`size-icon-${SWITCH_CONTENT_ICON_STEP[size]}`);
		}
	});

	test("the content layers share the thumb's footprint", () => {
		// Each sits exactly where the thumb rests at its own end, so a glyph is
		// centred on the space the knob will vacate rather than beside it.
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			const thumb = iconUtilityPx(cls(slots.thumb()));
			expect(iconUtilityPx(cls(slots.startContent()))).toBe(thumb);
			expect(iconUtilityPx(cls(slots.endContent()))).toBe(thumb);
		}
	});
});

describe("switchVariants slots", () => {
	test("the tv describes no colour beyond the resting appearance", () => {
		// Every colour on this control is interpolated, so a `bg-*` per colour here
		// would be a second source for one surface — the drift a class and a style
		// produce for a frame on every toggle.
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			expect(cls(slots.track())).toMatch(/\bbg-secondary\b/);
			expect(cls(slots.thumb())).toMatch(/\bbg-background\b/);
			expect(cls(slots.track())).not.toMatch(/\bbg-(primary|success|warning|danger|info)\b/);
			expect(cls(slots.thumb())).not.toMatch(/\bbg-(primary|success|warning|danger|info)\b/);
		}
	});

	test("no slot carries a text treatment", () => {
		// Every slot is worn by a View, and a View does not cascade colour to a
		// Text descendant. A glyph's colour is a token, not a class. Rule 1.
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			for (const value of [slots.touchArea(), slots.track(), slots.thumb(), slots.startContent(), slots.endContent()]) {
				expect(cls(value)).not.toMatch(/\b(text|font)-/);
			}
		}
	});

	test("the track clips, so composed content cannot paint over the capsule's edge", () => {
		for (const size of SWITCH_SIZES) {
			expect(cls(slotsFor(size).track())).toMatch(/\boverflow-hidden\b/);
		}
	});

	test("the touch area does not stretch", () => {
		// Without this a switch in a gap column spans the screen and a tap far from
		// the pill toggles it.
		for (const size of SWITCH_SIZES) {
			expect(cls(slotsFor(size).touchArea())).toMatch(/\bself-start\b/);
		}
	});

	test("neither animated node carries the disabled fade", () => {
		// `track` and `thumb` both run a useAnimatedStyle. A treatment that would
		// break the moment one of them wrote `opacity` is one waiting to fail
		// silently — the failure Radio records for a class on Pressable's own node.
		for (const size of SWITCH_SIZES) {
			const slots = switchVariants({ size, isDisabled: true });
			expect(cls(slots.touchArea())).toMatch(/\bopacity-50\b/);
			expect(cls(slots.track())).not.toMatch(/\bopacity-/);
			expect(cls(slots.thumb())).not.toMatch(/\bopacity-/);
		}
	});

	test("nothing draws a shadow", () => {
		// Nothing else in this package does, and React Native's shadow props
		// diverge between platforms in a way a one-pixel border does not.
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			for (const value of [slots.track(), slots.thumb()]) {
				expect(cls(value)).not.toMatch(/\bshadow/);
			}
		}
	});
});

describe("switch colour tokens", () => {
	test("every thumb token is the foreground of its own track token", () => {
		// Two maps that can drift is how a switch ends up with a pale knob on a
		// near-white track. `default` is the exception the theme forces: there is
		// no `--color-foreground-foreground`.
		for (const color of SWITCH_COLORS) {
			if (color === "default") {
				expect(SWITCH_TRACK_TOKEN[color]).toBe("foreground");
				expect(SWITCH_THUMB_TOKEN[color]).toBe("background");
				continue;
			}
			expect(SWITCH_THUMB_TOKEN[color]).toBe(`${SWITCH_TRACK_TOKEN[color]}-foreground`);
		}
	});

	test("every token named is declared in both variants of theme.css", () => {
		// A token no theme emits resolves to undefined, is dropped, and the surface
		// silently keeps whatever it started as.
		const tokens = [
			...Object.values(SWITCH_TRACK_TOKEN),
			...Object.values(SWITCH_THUMB_TOKEN),
			SWITCH_TRACK_REST_TOKEN,
			SWITCH_THUMB_REST_TOKEN,
			SWITCH_INVALID_TRACK_TOKEN,
			SWITCH_INVALID_THUMB_TOKEN,
			SWITCH_CONTENT_REST_TOKEN,
		];
		for (const token of tokens) expect(themeDeclarations(token)).toBe(2);
	});

	test("the four semantic colours stay distinct from each other and from the neutrals", () => {
		// Two cells collapsing means a caller can set the axis and see nothing move.
		const tracks = SWITCH_COLORS.map((color) => SWITCH_TRACK_TOKEN[color]);
		expect(new Set(tracks).size).toBe(SWITCH_COLORS.length);
	});

	test("the track and the thumb never resolve to the same token", () => {
		for (const color of SWITCH_COLORS) {
			expect(SWITCH_THUMB_TOKEN[color]).not.toBe(SWITCH_TRACK_TOKEN[color]);
		}
	});
});

describe("resolveSwitchTrackTokens / resolveSwitchThumbTokens", () => {
	test("an off switch wears the field chrome at every colour", () => {
		for (const color of SWITCH_COLORS) {
			expect(resolveSwitchTrackTokens({ color, isInvalid: false }).rest).toBe(SWITCH_TRACK_REST_TOKEN);
			expect(resolveSwitchThumbTokens({ color, isInvalid: false }).rest).toBe(SWITCH_THUMB_REST_TOKEN);
		}
	});

	test("an on switch fades to its own colour", () => {
		for (const color of SWITCH_COLORS) {
			expect(resolveSwitchTrackTokens({ color, isInvalid: false }).active).toBe(SWITCH_TRACK_TOKEN[color]);
			expect(resolveSwitchThumbTokens({ color, isInvalid: false }).active).toBe(SWITCH_THUMB_TOKEN[color]);
		}
	});

	test("invalid outranks the colour at both ends, so there is nothing to fade", () => {
		// The colour is the signal the value is wrong, and it has to be there before
		// the switch is turned on as much as after.
		for (const color of SWITCH_COLORS) {
			const track = resolveSwitchTrackTokens({ color, isInvalid: true });
			const thumb = resolveSwitchThumbTokens({ color, isInvalid: true });
			expect(track.rest).toBe(SWITCH_INVALID_TRACK_TOKEN);
			expect(track.active).toBe(SWITCH_INVALID_TRACK_TOKEN);
			expect(thumb.rest).toBe(SWITCH_INVALID_THUMB_TOKEN);
			expect(thumb.active).toBe(SWITCH_INVALID_THUMB_TOKEN);
		}
	});
});

describe("resolveSwitchAxes", () => {
	test("the switch's own props win over the field", () => {
		const axes = resolveSwitchAxes({
			own: { color: "success", isDisabled: true, isInvalid: false, size: "lg" },
			field: { isDisabled: false, isInvalid: true },
		});
		expect(axes).toEqual({ color: "success", size: "lg", isDisabled: true, isInvalid: false });
	});

	test("a field reaches the state axes when the switch names neither", () => {
		const axes = resolveSwitchAxes({ field: { isDisabled: true, isInvalid: true } });
		expect(axes.isDisabled).toBe(true);
		expect(axes.isInvalid).toBe(true);
	});

	test("an explicit false opts out of a disabled field", () => {
		// `??` and never `||`, so `false` is a value rather than an absence.
		const axes = resolveSwitchAxes({ own: { isDisabled: false }, field: { isDisabled: true } });
		expect(axes.isDisabled).toBe(false);
	});

	test("a field cannot acquire a paint axis", () => {
		const axes = resolveSwitchAxes({ field: { isDisabled: true, isInvalid: true } });
		expect(axes.color).toBe(SWITCH_DEFAULT_COLOR);
		expect(axes.size).toBe(SWITCH_DEFAULT_SIZE);
	});

	test("nothing named anywhere settles on the defaults", () => {
		expect(resolveSwitchAxes({ own: {}, field: null })).toEqual({
			color: SWITCH_DEFAULT_COLOR,
			size: SWITCH_DEFAULT_SIZE,
			isDisabled: false,
			isInvalid: false,
		});
	});
});

describe("switchTravel", () => {
	test("a track that has not been measured yet has no travel, never a negative one", () => {
		expect(switchTravel({ trackWidth: 0, thumbWidth: 0, inset: SWITCH_THUMB_INSET })).toBe(0);
		expect(switchTravel({ trackWidth: 0, thumbWidth: 24, inset: SWITCH_THUMB_INSET })).toBe(0);
	});

	test("the inset comes off both ends", () => {
		expect(switchTravel({ trackWidth: 52, thumbWidth: 24, inset: 2 })).toBe(24);
	});
});

describe("resolveSwitchRelease", () => {
	test("a release that barely moved is a tap, and toggles", () => {
		// This is what lets one Gesture.Pan() serve both gestures rather than
		// racing a Tap against it.
		expect(resolveSwitchRelease({ progress: 0, distance: 0, velocity: 0, wasSelected: false })).toBe(true);
		expect(resolveSwitchRelease({ progress: 1, distance: 0, velocity: 0, wasSelected: true })).toBe(false);
	});

	test("a vertical swipe over the switch is not a tap and changes nothing", () => {
		// The finger moved nothing along the track, so the position is untouched —
		// but it did move, so reading the along-track translation alone would have
		// called this a tap and toggled on every attempt to scroll past.
		const scroll = SWITCH_TAP_SLOP + 30;
		expect(resolveSwitchRelease({ progress: 0, distance: scroll, velocity: 0, wasSelected: false })).toBe(false);
		expect(resolveSwitchRelease({ progress: 1, distance: scroll, velocity: 0, wasSelected: true })).toBe(true);
	});

	test("the tap slop is a tolerance, and a hair past it is not a tap", () => {
		expect(resolveSwitchRelease({ progress: 0, distance: SWITCH_TAP_SLOP - 1, velocity: 0, wasSelected: false })).toBe(
			true
		);
		expect(resolveSwitchRelease({ progress: 0, distance: SWITCH_TAP_SLOP, velocity: 0, wasSelected: false })).toBe(
			false
		);
	});

	test("a drag past the slop is settled by position, not by the state it started in", () => {
		const past = SWITCH_TAP_SLOP + 1;
		expect(resolveSwitchRelease({ progress: 0.2, distance: past, velocity: 0, wasSelected: false })).toBe(false);
		expect(resolveSwitchRelease({ progress: 0.8, distance: past, velocity: 0, wasSelected: false })).toBe(true);
	});

	test("a drag out and back commits nothing", () => {
		// It travelled, so it is not a tap; it came back, so position says off.
		expect(resolveSwitchRelease({ progress: 0.05, distance: 40, velocity: 0, wasSelected: false })).toBe(false);
	});

	test("a flick beats the position it stopped at", () => {
		// The one case where position is the wrong question: let go fast enough and
		// the switch goes the way the finger was going.
		const fling = SWITCH_FLING_VELOCITY + 1;
		expect(resolveSwitchRelease({ progress: 0.1, distance: 10, velocity: fling, wasSelected: false })).toBe(true);
		expect(resolveSwitchRelease({ progress: 0.9, distance: 10, velocity: -fling, wasSelected: true })).toBe(false);
	});

	test("a slow release below the fling threshold is left to the position", () => {
		const slow = SWITCH_FLING_VELOCITY - 1;
		expect(resolveSwitchRelease({ progress: 0.1, distance: 10, velocity: slow, wasSelected: false })).toBe(false);
	});

	test("exactly half way settles off, so the midpoint is not a coin toss", () => {
		expect(resolveSwitchRelease({ progress: 0.5, distance: 20, velocity: 0, wasSelected: false })).toBe(false);
	});
});

describe("hasThumbChild", () => {
	test("no children at all means the root composes one in", () => {
		expect(hasThumbChild([])).toBe(false);
	});

	test("content parts alone are not a thumb", () => {
		expect(hasThumbChild([false, false])).toBe(false);
	});

	test("a thumb anywhere among the children is the caller's own", () => {
		expect(hasThumbChild([false, true, false])).toBe(true);
	});
});

describe("SWITCH_THUMB_SPRING", () => {
	test("it settles without a visible bounce out of a capsule it sits inside", () => {
		// Underdamped enough to feel sprung, damped enough not to overshoot the
		// track it is clipped by.
		const critical = 2 * Math.sqrt(SWITCH_THUMB_SPRING.stiffness * SWITCH_THUMB_SPRING.mass);
		expect(SWITCH_THUMB_SPRING.damping).toBeLessThan(critical);
		expect(SWITCH_THUMB_SPRING.damping / critical).toBeGreaterThan(0.5);
	});
});

describe("content treatment", () => {
	test("only the slot handed to a TextClassProvider carries a text treatment", () => {
		// It is never worn by a View, which is the condition rule 1 sets — the five
		// View slots are swept for its absence above.
		for (const size of SWITCH_SIZES) {
			const value = cls(switchVariants({ size, isDisabled: false }).contentText());
			expect(value).toMatch(/\btext-/);
			expect(value).toMatch(/\bfont-/);
		}
	});

	test("every content text class names the token the glyph beside it uses", () => {
		// Tailwind's scanner is static, so this cannot be derived at runtime — which
		// makes two tables that could drift. The pin is what stops them.
		for (const color of SWITCH_COLORS) {
			expect(SWITCH_CONTENT_TEXT_CLASS[color]).toBe(`text-${SWITCH_THUMB_TOKEN[color]}`);
		}
		expect(SWITCH_CONTENT_REST_TEXT_CLASS).toBe(`text-${SWITCH_CONTENT_REST_TOKEN}`);
		expect(SWITCH_INVALID_CONTENT_TEXT_CLASS).toBe(`text-${SWITCH_INVALID_THUMB_TOKEN}`);
	});

	test("the start layer is drawn on the coloured track, the end layer on the resting one", () => {
		// Start is revealed when the switch is on; end when it is off. The surface
		// each sits on is the whole of the decision.
		for (const color of SWITCH_COLORS) {
			const start = resolveSwitchContentTreatment({ color, isInvalid: false, placement: "start" });
			const end = resolveSwitchContentTreatment({ color, isInvalid: false, placement: "end" });

			expect(start.color).toBe(SWITCH_THUMB_TOKEN[color]);
			expect(start.textClass).toBe(SWITCH_CONTENT_TEXT_CLASS[color]);
			expect(end.color).toBe(SWITCH_CONTENT_REST_TOKEN);
			expect(end.textClass).toBe(SWITCH_CONTENT_REST_TEXT_CLASS);
		}
	});

	test("invalid outranks the colour at both ends", () => {
		for (const color of SWITCH_COLORS) {
			for (const placement of ["start", "end"] as const) {
				const treatment = resolveSwitchContentTreatment({ color, isInvalid: true, placement });
				expect(treatment.color).toBe(SWITCH_INVALID_THUMB_TOKEN);
				expect(treatment.textClass).toBe(SWITCH_INVALID_CONTENT_TEXT_CLASS);
			}
		}
	});
});
