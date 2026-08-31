import { describe, expect, test } from "bun:test";
import { declaredTokens, RADIUS_BASE_PX, radiusMultiplier, radiusPx } from "../../styles/theme-tokens.test";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import { TEXT_SIZES } from "../text/text.variants";
import {
	CHECKBOX_ALIGNMENTS,
	CHECKBOX_BORDER_WIDTH,
	CHECKBOX_COLORS,
	CHECKBOX_GLYPH_TOKEN,
	CHECKBOX_HIT_SLOP,
	CHECKBOX_INDICATOR_ANIMATION,
	CHECKBOX_INVALID_BORDER_TOKEN,
	CHECKBOX_INVALID_GLYPH_TOKEN,
	CHECKBOX_RADIUS_MULTIPLIER,
	CHECKBOX_RADIUS_STEP,
	CHECKBOX_REST_BORDER_TOKEN,
	CHECKBOX_SIZES,
	CHECKBOX_SURFACE_TOKEN,
	checkboxVariants,
	resolveCheckboxAxes,
	resolveCheckboxBorderTokens,
	resolveCheckboxFilled,
	resolveCheckboxFillRadius,
	resolveCheckboxHitSlop,
	resolveCheckboxLabelColor,
	resolveCheckboxLabelSize,
	toggleCheckedValue,
} from "./checkbox.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** Position of a class string's `size-icon-*` token on the shared icon scale. */
function sizeStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

/** Tailwind's spacing step a class string sets its gap from. */
function gapOf(cls: string): number {
	return Number(cls.match(/\bgap-([\d.]+)\b/)?.[1]);
}

/** The `bg-*` token a class string paints its surface with, minus the prefix. */
function fillToken(cls: string): string | undefined {
	return cls.match(/\bbg-([\w-]+)\b/)?.[1];
}

/** The `border-*` colour token a class string resolves to, minus the prefix. */
function borderToken(cls: string): string | undefined {
	return cls.match(/\bborder-((?:[a-z]+-)*[a-z]+)\b/)?.[1];
}

describe("the theme.css reader", () => {
	// The token assertions below are only worth anything if the parse found something.
	test("finds both variants", () => {
		expect(LIGHT.size).toBeGreaterThan(0);
		expect(DARK.size).toBeGreaterThan(0);
	});
});

describe("checkboxVariants box slot", () => {
	test("defaults to the unchecked default md box", () => {
		const cls = checkboxVariants().box();
		expect(cls).toContain("size-icon-lg");
		expect(cls).toContain("border-input");
		expect(cls).toContain("bg-card");
	});

	test("is square at every size, from the shared icon scale", () => {
		for (const size of CHECKBOX_SIZES) {
			const cls = checkboxVariants({ size }).box();
			// No scale of its own. A checkbox is a glyph in a box and both
			// measurements already live on `--spacing-icon-*`.
			expect(sizeStep(cls)).toBeGreaterThanOrEqual(0);
			// `size-*` and never `w-*` with `h-*`: tailwind-merge conflicts `size`
			// into `w`/`h` but not the reverse, so a caller's `size-8` has to be
			// able to clear whatever is here.
			expect(cls).not.toMatch(/\bw-\d/);
			expect(cls).not.toMatch(/\bh-\d/);
		}
	});

	test("steps up with the size, on that same scale", () => {
		const steps = CHECKBOX_SIZES.map((size) => sizeStep(checkboxVariants({ size }).box()));
		expect(steps).toEqual([...steps].sort((a, b) => a - b));
		expect(new Set(steps).size).toBe(CHECKBOX_SIZES.length);
	});

	test("sits exactly two steps above its own glyph, at every size", () => {
		for (const size of CHECKBOX_SIZES) {
			const slots = checkboxVariants({ size });
			// The gap that leaves the tick breathing room inside the box. Pinned as
			// an offset rather than as points, so the icon scale can be retuned
			// without this test becoming a transcript of it.
			expect(sizeStep(slots.box()) - sizeStep(slots.glyph())).toBe(2);
		}
	});

	test("clips its own fill at every size", () => {
		for (const size of CHECKBOX_SIZES) {
			// The indicator is an absolute layer under a rounded border. Without
			// this it paints square corners over the box's own.
			expect(checkboxVariants({ size }).box()).toContain("overflow-hidden");
		}
	});

	test("reserves the border on every colour, filled or not", () => {
		for (const color of CHECKBOX_COLORS) {
			for (const isFilled of [true, false]) {
				// A border declared only where it shows would move the glyph by a
				// point the moment the box was ticked.
				expect(checkboxVariants({ color, isFilled }).box()).toMatch(/\bborder\b/);
			}
		}
	});

	test("rests on the field's border, at every colour and either state", () => {
		for (const color of CHECKBOX_COLORS) {
			for (const isFilled of [true, false]) {
				// The class is the resting appearance only. The live colour is an
				// interpolated style, because a colour that fades cannot be a class
				// — see `resolveCheckboxBorderTokens`.
				expect(borderToken(checkboxVariants({ color, isFilled }).box())).toBe(CHECKBOX_REST_BORDER_TOKEN);
			}
		}
	});

	test("names no colour of its own in a class, at any colour", () => {
		for (const color of CHECKBOX_COLORS) {
			// Two sources for one border is how the class and the animated style
			// end up disagreeing for a frame on every toggle.
			expect(borderToken(checkboxVariants({ color, isFilled: true }).box())).not.toBe(color);
		}
	});

	test("offsets itself onto the label's first line at every size", () => {
		for (const size of CHECKBOX_SIZES) {
			// Half the difference between the label's line box and the box, so
			// `items-start` on the row still reads as centred on one line. Without
			// this the box would sit a point or two high on every single-line
			// checkbox in the library.
			expect(checkboxVariants({ size }).box()).toMatch(/\bmt-(px|[\d.]+)\b/);
		}
	});

	test("merges an incoming className last", () => {
		expect(checkboxVariants().box({ className: "size-8" })).toContain("size-8");
		expect(checkboxVariants().box({ className: "size-8" })).not.toContain("size-icon-lg");
	});
});

describe("checkboxVariants indicator slot", () => {
	test("fills the box edge to edge", () => {
		const cls = checkboxVariants().indicator();
		expect(cls).toContain("absolute");
		expect(cls).toContain("inset-0");
	});

	test("holds no layout for the glyph, which the tick layers own", () => {
		// The fill scales, and a glyph inside it would scale with it. The tick is
		// a sibling drawn on top so the two can move as different gestures.
		expect(checkboxVariants().indicator()).not.toContain("justify-center");
	});

	test("carries no corner radius of its own, at any size", () => {
		for (const size of CHECKBOX_SIZES) {
			// `overflow-hidden` on the box can only subtract, so a radius here has
			// to equal the border's *inner* curve — the box's radius minus its
			// border width — or the corners are cut back further than the border's
			// and the box's background shows through as a sliver. The radius is
			// animated to zero instead and the box does the rounding.
			expect(checkboxVariants({ size }).indicator()).not.toMatch(/\brounded-/);
		}
	});

	test("paints a distinct surface for every colour", () => {
		const fills = CHECKBOX_COLORS.map((color) => fillToken(checkboxVariants({ color }).indicator()));
		// Two colours resolving to one fill means a caller can set the axis and
		// see nothing change.
		expect(new Set(fills).size).toBe(CHECKBOX_COLORS.length);
		expect(fills.every((fill) => fill !== undefined)).toBe(true);
	});

	test("turns destructive when invalid, at every colour", () => {
		for (const color of CHECKBOX_COLORS) {
			expect(fillToken(checkboxVariants({ color, isInvalid: true }).indicator())).toBe("destructive");
		}
	});
});

describe("resolveCheckboxFillRadius", () => {
	test("is the box's own radius minus its border, at every size", () => {
		for (const size of CHECKBOX_SIZES) {
			// The rule for two rounded rectangles to sit concentric. Rounder and
			// `overflow-hidden` cuts the fill's corners back past the border's,
			// leaving a sliver of the box's background at each one; squarer and the
			// fill reads as a sharp square inside a rounded box.
			expect(resolveCheckboxFillRadius(size, RADIUS_BASE_PX)).toBe(
				radiusPx(CHECKBOX_RADIUS_STEP[size]) - CHECKBOX_BORDER_WIDTH
			);
		}
	});

	// The multipliers are restated in TypeScript because the corner scale is
	// `@theme inline` and no `--radius-*` variable reaches the runtime. Retuning
	// the scale in `tokens.css` has to fail here rather than quietly leave the
	// fill on the old curve.
	test("multiplies --radius by what tokens.css says that step multiplies it by", () => {
		for (const [step, multiplier] of Object.entries(CHECKBOX_RADIUS_MULTIPLIER)) {
			expect(multiplier).toBe(radiusMultiplier(step));
		}
	});

	test("follows --radius, so a pasted theme moves the fill with the border", () => {
		for (const size of CHECKBOX_SIZES) {
			const doubled = resolveCheckboxFillRadius(size, RADIUS_BASE_PX * 2);
			expect(doubled).toBe(radiusPx(CHECKBOX_RADIUS_STEP[size]) * 2 - CHECKBOX_BORDER_WIDTH);
		}
	});

	test("never goes negative, so a square-cornered theme draws a square fill", () => {
		for (const size of CHECKBOX_SIZES) expect(resolveCheckboxFillRadius(size, 0)).toBe(0);
	});

	test("names the radius step the box actually wears", () => {
		for (const size of CHECKBOX_SIZES) {
			// Two places naming a radius is how the fill ends up concentric with a
			// curve the box stopped using.
			expect(checkboxVariants({ size }).box()).toContain(`rounded-${CHECKBOX_RADIUS_STEP[size]}`);
		}
	});

	test("assumes the bare border width the box actually sets", () => {
		for (const size of CHECKBOX_SIZES) {
			const cls = checkboxVariants({ size }).box();
			// `CHECKBOX_BORDER_WIDTH` is Tailwind's bare `border`. A `border-2` here
			// would silently make every fill a point too round.
			expect(cls).toMatch(/(^|\s)border(\s|$)/);
			expect(cls).not.toMatch(/\bborder-\d/);
		}
	});
});

describe("checkboxVariants tick slots", () => {
	test("clips from the box's left edge, spanning its full height", () => {
		const cls = checkboxVariants().tick();
		expect(cls).toContain("absolute");
		expect(cls).toContain("left-0");
		expect(cls).toContain("inset-y-0");
		// Without this the glyph is not revealed across, it just sits there while
		// a container of no consequence changes width around it.
		expect(cls).toContain("overflow-hidden");
	});

	test("keeps the glyph on the box's centre line behind that clip", () => {
		const cls = checkboxVariants().tickInner();
		expect(cls).toContain("items-center");
		expect(cls).toContain("justify-center");
		// Full height, and a width the component sets from the measured box — so
		// the glyph stays put while the clip in front of it opens rather than
		// sliding across with it.
		expect(cls).toContain("h-full");
	});

	test("leaves the clip no width of its own", () => {
		// The width is animated from the measured box, so a `w-*` here would be a
		// second answer that tailwind-merge resolves and Reanimated then ignores.
		expect(checkboxVariants().tick()).not.toMatch(/\bw-/);
	});
});

describe("checkboxVariants root slot", () => {
	test("lays the box and its label out as a row, aligned to the first line", () => {
		expect(checkboxVariants().root()).toContain("flex-row");
		// Not `items-center`. A wrapped label centred against its own paragraph
		// drifts the box down the side of it — what `Input` refuses for a
		// multiline field's decorators. The box's own margin puts a single-line
		// label back where centring had it.
		expect(checkboxVariants().root()).toContain("items-start");
		expect(checkboxVariants().root()).not.toContain("items-center");
	});

	test("carries no text utility at any size", () => {
		for (const size of CHECKBOX_SIZES) {
			// A React Native View does not cascade colour to a Text descendant, so
			// a `text-*` here would be a class that does nothing. See AGENTS.md
			// rule 1 — the label's treatment is the `Text.Label` preset's.
			expect(checkboxVariants({ size }).root()).not.toMatch(/\btext-/);
		}
	});

	test("steps its gap up with the size", () => {
		const gaps = CHECKBOX_SIZES.map((size) => gapOf(checkboxVariants({ size }).root()));
		expect(gaps).toEqual([...gaps].sort((a, b) => a - b));
		expect(new Set(gaps).size).toBe(CHECKBOX_SIZES.length);
	});

	test("fades the whole row when disabled, so the label goes with the box", () => {
		expect(checkboxVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(checkboxVariants({ isDisabled: false }).root()).not.toContain("opacity-50");
	});
});

describe("checkboxVariants label slot", () => {
	test("carries no type scale, weight or colour at any size", () => {
		for (const size of CHECKBOX_SIZES) {
			for (const isInvalid of [true, false]) {
				const cls = checkboxVariants({ isInvalid, size }).label();
				// The scale belongs to `Text.Label` and the colour to `Text`'s own
				// axis. A `text-sm font-medium` here would be a second definition
				// of the preset that could drift from it — Field's rule, and the
				// reason `Input` ships no label part at all.
				expect(cls).not.toMatch(/\btext-/);
				expect(cls).not.toMatch(/\bfont-/);
			}
		}
	});

	test("shrinks so a long label wraps instead of pushing the box off the row", () => {
		expect(checkboxVariants().label()).toContain("shrink");
	});
});

describe("checkboxVariants glyph slot", () => {
	test("steps up with the size, on the shared icon scale", () => {
		const steps = CHECKBOX_SIZES.map((size) => sizeStep(checkboxVariants({ size }).glyph()));
		expect(steps.every((step) => step >= 0)).toBe(true);
		expect(steps).toEqual([...steps].sort((a, b) => a - b));
		expect(new Set(steps).size).toBe(CHECKBOX_SIZES.length);
	});
});

describe("checkboxVariants alignment", () => {
	test("puts the box first by default", () => {
		expect(checkboxVariants({ alignment: "start" }).root()).not.toContain("flex-row-reverse");
		expect(checkboxVariants({ alignment: "start" }).label()).not.toContain("grow");
	});

	test("pushes the box to the far edge and fills the row with the label", () => {
		expect(checkboxVariants({ alignment: "end" }).root()).toContain("flex-row-reverse");
		expect(checkboxVariants({ alignment: "end" }).label()).toContain("grow");
	});
});

describe("CHECKBOX_GLYPH_TOKEN", () => {
	test("names a token for every colour", () => {
		expect(Object.keys(CHECKBOX_GLYPH_TOKEN).sort()).toEqual([...CHECKBOX_COLORS].sort());
	});

	test("pairs each glyph with the fill its own indicator paints", () => {
		for (const color of CHECKBOX_COLORS) {
			// Two maps that can drift is how a checkbox ends up with a white tick
			// on a pale fill. The foreground is always the fill's own.
			expect(CHECKBOX_GLYPH_TOKEN[color]).toBe(`${fillToken(checkboxVariants({ color }).indicator())}-foreground`);
		}
	});

	test("declares every token it names in both themes", () => {
		for (const token of [...Object.values(CHECKBOX_GLYPH_TOKEN), CHECKBOX_INVALID_GLYPH_TOKEN]) {
			expect(LIGHT.has(token)).toBe(true);
			expect(DARK.has(token)).toBe(true);
		}
	});

	test("pairs the invalid glyph with the invalid fill", () => {
		expect(CHECKBOX_INVALID_GLYPH_TOKEN).toBe(
			`${fillToken(checkboxVariants({ isInvalid: true }).indicator())}-foreground`
		);
	});
});

describe("CHECKBOX_SURFACE_TOKEN", () => {
	test("names a token for every colour", () => {
		expect(Object.keys(CHECKBOX_SURFACE_TOKEN).sort()).toEqual([...CHECKBOX_COLORS].sort());
	});

	test("matches the fill its own indicator paints", () => {
		for (const color of CHECKBOX_COLORS) {
			// The border interpolates to this token, so a drift here is a border
			// settling on a shade the surface behind it never uses.
			expect(fillToken(checkboxVariants({ color }).indicator())).toBe(CHECKBOX_SURFACE_TOKEN[color]);
		}
	});

	test("declares every border token it can resolve to in both themes", () => {
		const tokens = [
			...Object.values(CHECKBOX_SURFACE_TOKEN),
			CHECKBOX_REST_BORDER_TOKEN,
			CHECKBOX_INVALID_BORDER_TOKEN,
		];
		for (const token of tokens) {
			// An unresolved token yields `undefined`, which the component falls
			// back to `transparent` for — a border that silently vanishes in one
			// theme. This is the test that keeps that fallback unreachable.
			expect(LIGHT.has(token)).toBe(true);
			expect(DARK.has(token)).toBe(true);
		}
	});
});

describe("resolveCheckboxBorderTokens", () => {
	test("travels from the field chrome to the colour's own fill", () => {
		for (const color of CHECKBOX_COLORS) {
			expect(resolveCheckboxBorderTokens({ color, isInvalid: false })).toEqual({
				active: CHECKBOX_SURFACE_TOKEN[color],
				rest: CHECKBOX_REST_BORDER_TOKEN,
			});
		}
	});

	test("holds destructive at both ends when invalid, so there is nothing to fade", () => {
		for (const color of CHECKBOX_COLORS) {
			// The border is the signal that the value is wrong, and it has to be
			// there before the box is ticked as much as after — so an invalid box
			// never fades into or out of it.
			const tokens = resolveCheckboxBorderTokens({ color, isInvalid: true });
			expect(tokens.rest).toBe(CHECKBOX_INVALID_BORDER_TOKEN);
			expect(tokens.active).toBe(CHECKBOX_INVALID_BORDER_TOKEN);
		}
	});
});

describe("resolveCheckboxFilled", () => {
	test("paints the surface when checked", () => {
		expect(resolveCheckboxFilled({ isChecked: true, isIndeterminate: false })).toBe(true);
	});

	test("paints the surface when indeterminate, checked or not", () => {
		// Indeterminate fills exactly as checked does — only the glyph differs.
		expect(resolveCheckboxFilled({ isChecked: false, isIndeterminate: true })).toBe(true);
		expect(resolveCheckboxFilled({ isChecked: true, isIndeterminate: true })).toBe(true);
	});

	test("leaves it empty otherwise", () => {
		expect(resolveCheckboxFilled({ isChecked: false, isIndeterminate: false })).toBe(false);
	});
});

describe("resolveCheckboxAxes", () => {
	const GROUP = { alignment: "end", color: "success", isDisabled: false, isInvalid: false, size: "lg" } as const;
	const FIELD = { isDisabled: true, isInvalid: true } as const;

	test("falls back to the defaults with nothing around it", () => {
		expect(resolveCheckboxAxes({ own: {} })).toEqual({
			alignment: "start",
			color: "default",
			isDisabled: false,
			isInvalid: false,
			size: "md",
		});
	});

	test("takes the group's axes when the checkbox names none", () => {
		const axes = resolveCheckboxAxes({ group: GROUP, own: {} });
		expect(axes.color).toBe("success");
		expect(axes.size).toBe("lg");
		expect(axes.alignment).toBe("end");
	});

	test("lets the checkbox's own axis beat the group's", () => {
		// Unlike Input.Group, which owns one box and therefore owns the axes that
		// draw it. Checkbox.Group owns no box — it is a wrapper supplying
		// defaults, the same kind of thing as Field, so a control overrides it.
		const axes = resolveCheckboxAxes({ group: GROUP, own: { color: "destructive", size: "sm" } });
		expect(axes.color).toBe("destructive");
		expect(axes.size).toBe("sm");
		expect(axes.alignment).toBe("end");
	});

	test("reads the field last, behind both", () => {
		expect(resolveCheckboxAxes({ field: FIELD, own: {} }).isInvalid).toBe(true);
		expect(resolveCheckboxAxes({ field: FIELD, own: {} }).isDisabled).toBe(true);
		expect(
			resolveCheckboxAxes({ field: FIELD, group: { isDisabled: false, isInvalid: false }, own: {} }).isInvalid
		).toBe(false);
		expect(resolveCheckboxAxes({ field: FIELD, own: { isInvalid: false } }).isInvalid).toBe(false);
	});

	test("lets an explicit false opt out of an invalid field", () => {
		// `??` and never `||`, so `false` is an answer rather than an absence.
		expect(resolveCheckboxAxes({ field: FIELD, own: { isDisabled: false } }).isDisabled).toBe(false);
	});
});

describe("toggleCheckedValue", () => {
	test("appends a value that is absent", () => {
		expect(toggleCheckedValue(["a"], "b")).toEqual(["a", "b"]);
	});

	test("removes a value that is present", () => {
		expect(toggleCheckedValue(["a", "b", "c"], "b")).toEqual(["a", "c"]);
	});

	test("preserves the order the rest were checked in", () => {
		expect(toggleCheckedValue(["c", "a"], "b")).toEqual(["c", "a", "b"]);
	});

	test("returns a new array either way", () => {
		// React bails out of a re-render on an unchanged reference, so a mutated
		// array would toggle the state and leave the screen alone.
		const current = ["a"];
		expect(toggleCheckedValue(current, "b")).not.toBe(current);
		expect(toggleCheckedValue(current, "a")).not.toBe(current);
		expect(current).toEqual(["a"]);
	});

	test("removes every copy of a value that somehow appears twice", () => {
		expect(toggleCheckedValue(["a", "a"], "a")).toEqual([]);
	});
});

describe("resolveCheckboxLabelSize", () => {
	test("names a Text step for every checkbox size", () => {
		for (const size of CHECKBOX_SIZES) {
			expect(TEXT_SIZES).toContain(resolveCheckboxLabelSize(size));
		}
	});

	test("steps up with the box", () => {
		const steps = CHECKBOX_SIZES.map((size) => TEXT_SIZES.indexOf(resolveCheckboxLabelSize(size)));
		expect(steps).toEqual([...steps].sort((a, b) => a - b));
		expect(new Set(steps).size).toBe(CHECKBOX_SIZES.length);
	});
});

describe("resolveCheckboxLabelColor", () => {
	test("turns the label destructive with the box it names", () => {
		expect(resolveCheckboxLabelColor(true)).toBe("destructive");
	});

	test("leaves the preset's own colour alone otherwise", () => {
		// `undefined` is the answer, not a gap: Text's colour axis emits nothing
		// when unnamed, so the label falls through to `Text.Label`'s own token.
		expect(resolveCheckboxLabelColor(false)).toBeUndefined();
	});
});

describe("resolveCheckboxHitSlop", () => {
	test("pads a bare box out toward the 44pt minimum target", () => {
		for (const size of CHECKBOX_SIZES) {
			expect(resolveCheckboxHitSlop({ hasLabel: false, size })).toBe(CHECKBOX_HIT_SLOP[size]);
		}
	});

	test("leaves a labelled row alone", () => {
		for (const size of CHECKBOX_SIZES) {
			// The row is the target once there is a label, and it is already wide.
			// Slop on top of it would overlap the next row's and make a tap between
			// two checkboxes ambiguous.
			expect(resolveCheckboxHitSlop({ hasLabel: true, size })).toBeUndefined();
		}
	});
});

describe("CHECKBOX_HIT_SLOP", () => {
	test("brings every bare box to at least 44 points", () => {
		const BOX_PX = { sm: 18, md: 20, lg: 24 } as const;
		for (const size of CHECKBOX_SIZES) {
			expect(BOX_PX[size] + CHECKBOX_HIT_SLOP[size] * 2).toBeGreaterThanOrEqual(44);
		}
	});
});

describe("CHECKBOX_INDICATOR_ANIMATION", () => {
	test("moves both of the fill's tracks", () => {
		for (const [from, to] of [CHECKBOX_INDICATOR_ANIMATION.opacity, CHECKBOX_INDICATOR_ANIMATION.scale]) {
			expect(from).not.toBe(to);
		}
	});

	test("names no corner radius, because the fill's never changes", () => {
		// The radius that keeps the fill concentric with the border is a fixed
		// geometric fact, not a track. Animating it means it is only correct at
		// one end — see resolveCheckboxFillRadius.
		expect(CHECKBOX_INDICATOR_ANIMATION).not.toHaveProperty("borderRadius");
	});

	test("ends filled at the values a painted box needs", () => {
		// The fill has to land fully opaque and unscaled, or a checked box is
		// permanently stopped mid-animation.
		expect(CHECKBOX_INDICATOR_ANIMATION.opacity[1]).toBe(1);
		expect(CHECKBOX_INDICATOR_ANIMATION.scale[1]).toBe(1);
	});

	test("starts invisible, so an unchecked box shows none of the fill", () => {
		expect(CHECKBOX_INDICATOR_ANIMATION.opacity[0]).toBe(0);
	});

	test("scales the fill up rather than down, so it grows into the box", () => {
		expect(CHECKBOX_INDICATOR_ANIMATION.scale[0]).toBeLessThan(CHECKBOX_INDICATOR_ANIMATION.scale[1]);
	});

	test("names no translation, so the fill arrives from the centre and not an edge", () => {
		// A checkbox is filled, not slid into. A `translateX` here would make the
		// surface enter from one side, which reads as a panel rather than a fill.
		expect(CHECKBOX_INDICATOR_ANIMATION).not.toHaveProperty("translateX");
	});

	test("holds the tick back, but not past the end of the fill", () => {
		// At 0 the stroke and the surface it is drawn on start together and read
		// as one blurred event; at 1 the tick would never draw at all.
		expect(CHECKBOX_INDICATOR_ANIMATION.tickDelay).toBeGreaterThan(0);
		expect(CHECKBOX_INDICATOR_ANIMATION.tickDelay).toBeLessThan(1);
	});

	test("starts the border after the tick, so it reads as the fill arriving", () => {
		// The fill scales 0.8 -> 1, so it is only near the edge late in its
		// travel. A border that changed at the same moment as the tick would read
		// as a second thing happening rather than as the surface reaching it.
		expect(CHECKBOX_INDICATOR_ANIMATION.borderDelay).toBeGreaterThan(CHECKBOX_INDICATOR_ANIMATION.tickDelay);
		expect(CHECKBOX_INDICATOR_ANIMATION.borderDelay).toBeLessThan(1);
	});

	test("is quick enough to read as a state change rather than a transition", () => {
		expect(CHECKBOX_INDICATOR_ANIMATION.durationMs).toBeLessThanOrEqual(200);
	});
});

describe("the exported axis arrays", () => {
	test("list every key the tv() declares", () => {
		expect([...CHECKBOX_COLORS].sort()).toEqual([...CHECKBOX_COLORS].sort());
		expect(CHECKBOX_SIZES.length).toBe(3);
		expect([...CHECKBOX_ALIGNMENTS]).toEqual(["start", "end"]);
	});
});
