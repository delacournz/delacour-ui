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
	SWITCH_PRESS_ANIMATION,
	SWITCH_SIZES,
	SWITCH_TAP_SLOP,
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
	test("every content step is a size the icon scale has, and fits inside the knob", () => {
		for (const size of SWITCH_SIZES) {
			const step = SWITCH_CONTENT_ICON_STEP[size];
			expect(ICON_SIZES).toContain(step);
			// A glyph in a knob, not a second knob.
			expect(spacingPx(`icon-${step}`)).toBeLessThan(utilityPx(cls(slotsFor(size).thumb()), "h"));
		}
	});

	test("the thumb is wider than it is tall at every size", () => {
		// The shape of the control: a rounded rectangle lying on its side, not a
		// disc. A size that came out square would be a size nobody noticed.
		for (const size of SWITCH_SIZES) {
			const thumb = cls(slotsFor(size).thumb());
			expect(utilityPx(thumb, "w")).toBeGreaterThan(utilityPx(thumb, "h"));
		}
	});

	test("the thumb is as wide as the track is tall", () => {
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			expect(utilityPx(cls(slots.thumb()), "w")).toBe(utilityPx(cls(slots.track()), "h"));
		}
	});

	test("the thumb's height is the track's less twice the vertical inset", () => {
		// Never written as a class — the track is `justify-center`, so the parent
		// centres it. This is the relationship that inset actually describes.
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			const track = utilityPx(cls(slots.track()), "h");
			expect(utilityPx(cls(slots.thumb()), "h")).toBe(track - SWITCH_THUMB_INSET * 2);
		}
	});

	test("the two capsules are concentric", () => {
		// Both are `rounded-full`, so each radius is half its own height and the
		// difference is the vertical inset — the subtraction `Checkbox`'s fill
		// makes against its border, arrived at by construction rather than a number.
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			expect(cls(slots.track())).toMatch(/\brounded-full\b/);
			expect(cls(slots.thumb())).toMatch(/\brounded-full\b/);

			const trackRadius = utilityPx(cls(slots.track()), "h") / 2;
			const thumbRadius = utilityPx(cls(slots.thumb()), "h") / 2;
			expect(trackRadius - thumbRadius).toBe(SWITCH_THUMB_INSET);
		}
	});

	test("the horizontal inset written into the slots is the one the travel subtracts", () => {
		// The maths takes it off twice. A slot and the constant disagreeing is a
		// thumb that stops a point short of the far edge, at every size.
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			expect(utilityPx(cls(slots.thumb()), "left")).toBe(SWITCH_THUMB_INSET);
			expect(utilityPx(cls(slots.startContent()), "left")).toBe(SWITCH_THUMB_INSET);
			expect(utilityPx(cls(slots.endContent()), "right")).toBe(SWITCH_THUMB_INSET);
		}
	});

	test("the thumb travels the length the track leaves it, and it is a real distance", () => {
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			const track = cls(slots.track());
			const thumbWidth = utilityPx(cls(slots.thumb()), "w");
			const travel = switchTravel({
				inset: SWITCH_THUMB_INSET,
				thumbWidth,
				trackWidth: utilityPx(track, "w"),
			});

			expect(travel).toBe(utilityPx(track, "w") - thumbWidth - SWITCH_THUMB_INSET * 2);
			// Short enough and the drag has no room; longer than the thumb and the
			// knob reads as lost in the track rather than filling it.
			expect(travel).toBeGreaterThan(0);
			expect(travel).toBeLessThanOrEqual(thumbWidth);
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
		// the map, because the comparison above needs a value.
		for (const size of SWITCH_SIZES) {
			expect(cls(slotsFor(size).glyph())).toBe(`size-icon-${SWITCH_CONTENT_ICON_STEP[size]}`);
		}
	});

	test("a content layer is exactly the space the knob vacates", () => {
		// The travel, not the thumb's width. Size them like the knob and the two
		// layers plus the thumb are wider than the track: the far layer reaches
		// under the knob, and its text is clipped by a knob drawn on top of it.
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			const thumb = cls(slots.thumb());
			const travel = switchTravel({
				inset: SWITCH_THUMB_INSET,
				thumbWidth: utilityPx(thumb, "w"),
				trackWidth: utilityPx(cls(slots.track()), "w"),
			});

			for (const layer of [cls(slots.startContent()), cls(slots.endContent())]) {
				expect(utilityPx(layer, "w")).toBe(travel);
				// The knob's height, so a glyph at either end sits on its centre line.
				expect(utilityPx(layer, "h")).toBe(utilityPx(thumb, "h"));
			}
		}
	});

	test("a resting thumb never overlaps the layer at the other end", () => {
		// The one that has to hold: the visible layer is always the far one, and a
		// knob reaching into it clips whatever it holds — a glyph is small enough to
		// survive that, so it only shows up at the size where the text is longest.
		// The near layer is under the knob by design, and faded to nothing anyway.
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			const trackWidth = utilityPx(cls(slots.track()), "w");
			const thumbWidth = utilityPx(cls(slots.thumb()), "w");
			const layerWidth = utilityPx(cls(slots.startContent()), "w");

			const thumbFarEdge = SWITCH_THUMB_INSET + thumbWidth;
			const layerNearEdge = trackWidth - SWITCH_THUMB_INSET - layerWidth;
			expect(thumbFarEdge).toBeLessThanOrEqual(layerNearEdge);
		}
	});

	test("the size ladder ascends", () => {
		const tracks = SWITCH_SIZES.map((size) => utilityPx(cls(slotsFor(size).track()), "h"));
		expect(tracks).toEqual([...tracks].sort((a, b) => a - b));
		expect(new Set(tracks).size).toBe(tracks.length);
	});
});

describe("switchVariants slots", () => {
	test("the tv describes no colour beyond the resting appearance", () => {
		// Every colour on this control is interpolated, so a `bg-*` per colour here
		// would be a second source for one surface — the drift a class and a style
		// produce for a frame on every toggle.
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			expect(cls(slots.track())).toMatch(/\bbg-input\b/);
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

	test("every slot that can hold content centres it", () => {
		// A View lays a child out at flex-start by default, so a glyph dropped into
		// an uncentred knob sits against its top-left corner inside a circle — which
		// reads as a mispositioned icon rather than as a missing class.
		for (const size of SWITCH_SIZES) {
			const slots = slotsFor(size);
			for (const value of [slots.thumb(), slots.startContent(), slots.endContent()]) {
				expect(cls(value)).toMatch(/\bitems-center\b/);
				expect(cls(value)).toMatch(/\bjustify-center\b/);
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

	test("the knob draws no border", () => {
		// A second line where there is already a boundary. Against a saturated track
		// it reads as a dark ring rather than as definition.
		for (const size of SWITCH_SIZES) {
			expect(cls(slotsFor(size).thumb())).not.toMatch(/\bborder\b|\bborder-/);
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
	test("it does not overshoot", () => {
		// A wider thumb travels a shorter distance inside a track that clips it, so
		// an overshoot has nowhere to go — the knob would visibly squash against the
		// end of its own capsule on every toggle.
		const critical = 2 * Math.sqrt(SWITCH_THUMB_SPRING.stiffness * SWITCH_THUMB_SPRING.mass);
		expect(SWITCH_THUMB_SPRING.damping / critical).toBeGreaterThanOrEqual(1);
	});

	test("it is not so overdamped that it crawls", () => {
		const critical = 2 * Math.sqrt(SWITCH_THUMB_SPRING.stiffness * SWITCH_THUMB_SPRING.mass);
		expect(SWITCH_THUMB_SPRING.damping / critical).toBeLessThan(1.3);
	});
});

describe("SWITCH_PRESS_ANIMATION", () => {
	test("a press shrinks the control without collapsing it", () => {
		expect(SWITCH_PRESS_ANIMATION.restScale).toBe(1);
		expect(SWITCH_PRESS_ANIMATION.pressedScale).toBeLessThan(1);
		expect(SWITCH_PRESS_ANIMATION.pressedScale).toBeGreaterThan(0.9);
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
