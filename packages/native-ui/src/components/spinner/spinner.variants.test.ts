import { describe, expect, test } from "bun:test";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import {
	isSpinnerSize,
	resolveSpinnerColor,
	resolveSpinnerRootClass,
	SPINNER_ARC_HEAD_OPACITY,
	SPINNER_ARC_JOINT_OPACITY,
	SPINNER_ARC_STOP_COUNT,
	SPINNER_ARC_STROKE_WIDTH,
	SPINNER_ARC_TAIL_OPACITY,
	SPINNER_COLOR_TOKEN,
	SPINNER_COLORS,
	SPINNER_FALLBACK_SIZE_CLASS,
	SPINNER_GLYPH_SIZE_CLASS,
	SPINNER_SIZES,
	spinnerArcStops,
	spinnerVariants,
} from "./spinner.variants";

/**
 * Position of a class string's `size-icon-*` token on the shared icon scale.
 *
 * Compares by step rather than by points, so a test says what it means and
 * survives a token being retuned in `tokens.css`. `tokens.test.ts` is what
 * keeps that array ordered.
 */
function iconStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

describe("isSpinnerSize", () => {
	test("separates a named size from an edge length", () => {
		for (const size of SPINNER_SIZES) {
			expect(isSpinnerSize(size)).toBe(true);
		}
		expect(isSpinnerSize(40)).toBe(false);
		expect(isSpinnerSize(undefined)).toBe(false);
	});
});

describe("resolveSpinnerRootClass", () => {
	test("centres its content whatever it is given", () => {
		for (const size of [undefined, "sm", 40] as const) {
			expect(resolveSpinnerRootClass({ size })).toContain("items-center");
		}
	});

	test("falls back only when there is nothing to inherit", () => {
		expect(resolveSpinnerRootClass({})).toContain(SPINNER_FALLBACK_SIZE_CLASS);
	});

	test("an inherited class beats the fallback", () => {
		expect(resolveSpinnerRootClass({ inherited: "size-icon-xs" })).toContain("size-icon-xs");
	});

	test("a named size beats an inherited class", () => {
		expect(resolveSpinnerRootClass({ inherited: "size-icon-xs", size: "lg" })).toContain("size-icon-lg");
	});

	test("a className beats a named size", () => {
		expect(resolveSpinnerRootClass({ className: "size-7", size: "sm" })).toContain("size-7");
	});

	test("gives every named size a distinct token, increasing with it", () => {
		const steps = SPINNER_SIZES.map((size) => iconStep(resolveSpinnerRootClass({ size })));
		expect(steps).not.toContain(-1);
		expect(new Set(steps).size).toBe(SPINNER_SIZES.length);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	// A number is not a class. `size-[40px]` built at runtime is never scanned by
	// Tailwind, so it would compile to nothing — the root takes a numeric size
	// through `style` instead, and the chain steps out of the way entirely rather
	// than leaving a losing class behind to argue with it.
	test("a numeric size emits no size class at all", () => {
		expect(resolveSpinnerRootClass({ size: 40 })).not.toMatch(/\bsize-/);
		expect(resolveSpinnerRootClass({ inherited: "size-icon-sm", size: 40 })).not.toMatch(/\bsize-/);
	});

	test("carries no colour", () => {
		for (const size of SPINNER_SIZES) {
			expect(resolveSpinnerRootClass({ size })).not.toMatch(/\b(text|bg|border)-/);
		}
	});
});

describe("SPINNER_GLYPH_SIZE_CLASS", () => {
	// A composed glyph fills the spinner rather than taking a fixed class, so it
	// still matches at a numeric size the class scale cannot express.
	test("fills the spinner rather than pinning a step", () => {
		expect(SPINNER_GLYPH_SIZE_CLASS).toBe("size-full");
	});
});

describe("resolveSpinnerColor", () => {
	test("maps each named colour to its token", () => {
		for (const color of SPINNER_COLORS) {
			expect(resolveSpinnerColor(color)).toBe(SPINNER_COLOR_TOKEN[color]);
		}
	});

	test("gives every named colour a distinct token", () => {
		const tokens = SPINNER_COLORS.map((color) => SPINNER_COLOR_TOKEN[color]);
		expect(new Set(tokens).size).toBe(SPINNER_COLORS.length);
	});

	test("passes a literal colour through untouched", () => {
		expect(resolveSpinnerColor("#EC4899")).toBe("#EC4899");
		expect(resolveSpinnerColor("rgb(236, 72, 153)")).toBe("rgb(236, 72, 153)");
	});

	test("passes an unnamed theme token through untouched", () => {
		expect(resolveSpinnerColor("emerald-500")).toBe("emerald-500");
		expect(resolveSpinnerColor("primary-foreground")).toBe("primary-foreground");
	});

	test("takes the inherited token when none is given", () => {
		expect(resolveSpinnerColor(undefined, "primary-foreground")).toBe("primary-foreground");
	});

	test("maps an inherited value that happens to be a named colour", () => {
		expect(resolveSpinnerColor(undefined, "danger")).toBe(SPINNER_COLOR_TOKEN.danger);
	});

	test("falls back only when there is nothing to inherit", () => {
		expect(resolveSpinnerColor(undefined)).toBe(SPINNER_COLOR_TOKEN.default);
	});

	test("an explicit colour beats the inherited one", () => {
		expect(resolveSpinnerColor("#EC4899", "primary-foreground")).toBe("#EC4899");
		expect(resolveSpinnerColor("danger", "primary-foreground")).toBe(SPINNER_COLOR_TOKEN.danger);
	});
});

describe("spinnerVariants root slot", () => {
	test("centres its content and carries no colour", () => {
		const cls = spinnerVariants().root();
		expect(cls).toContain("items-center");
		expect(cls).toContain("justify-center");
		expect(cls).not.toMatch(/\b(text|bg|border)-/);
	});

	test("takes no size until it is given one", () => {
		expect(spinnerVariants().root()).not.toMatch(/\bsize-/);
	});

	test("gives every named size a distinct token, increasing with it", () => {
		const steps = SPINNER_SIZES.map((size) => iconStep(spinnerVariants({ size }).root()));
		expect(steps).not.toContain(-1);
		expect(new Set(steps).size).toBe(SPINNER_SIZES.length);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	test("merges an incoming className last", () => {
		expect(spinnerVariants().root({ className: "opacity-80" })).toContain("opacity-80");
	});
});

describe("spinnerVariants content slot", () => {
	// Load-bearing, not tidiness. The arc is an <Svg> with no width or height,
	// which react-native-svg resolves to '100%'. If this layer were content-sized
	// that percentage would resolve against an indefinite parent and the whole
	// glyph would collapse to zero.
	test("fills the root, so the arc has a definite box to be 100% of", () => {
		expect(spinnerVariants().content()).toContain("size-full");
	});

	test("does not take a size of its own", () => {
		for (const size of SPINNER_SIZES) {
			expect(spinnerVariants({ size }).content()).toBe(spinnerVariants().content());
		}
	});

	test("carries no colour", () => {
		expect(spinnerVariants().content()).not.toMatch(/\b(text|bg|border)-/);
	});
});

/** The arc's geometry, restated here so a test compares against it rather than against itself. */
const ARC_CENTRE = 12;
const ARC_RADIUS = 10;

/**
 * Where a gradient running from `y = 2` to `y = 22` lands on the arc, a given
 * fraction of a half-turn clockwise from the top.
 *
 * This is the arc's real position — `y = 12 - 10·cos θ` — not a restatement of
 * the resolver's formula, so the linearity test below has something independent
 * to check against.
 */
function arcOffsetAtHalfTurn(turn: number): number {
	const y = ARC_CENTRE - ARC_RADIUS * Math.cos(Math.PI * turn);
	return (y - (ARC_CENTRE - ARC_RADIUS)) / (ARC_RADIUS * 2);
}

describe("spinnerArcStops", () => {
	test("spans the whole gradient axis, from one endpoint to the other", () => {
		const stops = spinnerArcStops(1, 0.55);
		expect(stops).toHaveLength(SPINNER_ARC_STOP_COUNT + 1);
		expect(stops.at(0)).toEqual({ offset: 0, opacity: 1 });
		expect(stops.at(-1)).toEqual({ offset: 1, opacity: 0.55 });
	});

	test("places every stop where the arc actually is at that angle", () => {
		const stops = spinnerArcStops(SPINNER_ARC_HEAD_OPACITY, SPINNER_ARC_JOINT_OPACITY);
		for (const [index, stop] of stops.entries()) {
			expect(stop.offset).toBeCloseTo(arcOffsetAtHalfTurn(index / SPINNER_ARC_STOP_COUNT), 10);
		}
	});

	// The whole point of the resolver. A two-stop gradient dims linearly in `y`,
	// and the arc's `y` goes as -cos θ, so the fade stalls at the sides and races
	// through the top and bottom — a white chunk beside a flat grey quadrant.
	test("dims by a constant step per equal turn of the arc", () => {
		const stops = spinnerArcStops(1, 0.55);
		const deltas = stops.slice(1).map((stop, index) => stop.opacity - (stops[index]?.opacity ?? 0));
		for (const delta of deltas) {
			expect(delta).toBeCloseTo(-0.45 / SPINNER_ARC_STOP_COUNT, 10);
		}
	});

	test("advances monotonically along both axes", () => {
		const stops = spinnerArcStops(SPINNER_ARC_TAIL_OPACITY, SPINNER_ARC_JOINT_OPACITY);
		for (const [index, stop] of stops.slice(1).entries()) {
			const previous = stops[index];
			expect(previous).toBeDefined();
			expect(stop.offset).toBeGreaterThan(previous?.offset ?? 0);
			expect(stop.opacity).toBeGreaterThan(previous?.opacity ?? 0);
		}
	});

	// The two half-rings are painted by separate gradients on one shared axis, so
	// a stop ladder that differed between them would kink the fade at the joint.
	test("gives both half-rings one offset ladder", () => {
		const lead = spinnerArcStops(SPINNER_ARC_HEAD_OPACITY, SPINNER_ARC_JOINT_OPACITY);
		const tail = spinnerArcStops(SPINNER_ARC_TAIL_OPACITY, SPINNER_ARC_JOINT_OPACITY);
		expect(tail.map((stop) => stop.offset)).toEqual(lead.map((stop) => stop.offset));
	});

	// The two ramps are drawn separately but read as one. Anything other than the
	// midpoint gives them different slopes, and the ring creases at the joint —
	// a soft bright wedge on one side of it, even though the alpha is continuous.
	test("carries one straight ramp across both half-rings", () => {
		const lead = spinnerArcStops(SPINNER_ARC_HEAD_OPACITY, SPINNER_ARC_JOINT_OPACITY);
		const tail = spinnerArcStops(SPINNER_ARC_TAIL_OPACITY, SPINNER_ARC_JOINT_OPACITY);
		const leadStep = (SPINNER_ARC_JOINT_OPACITY - SPINNER_ARC_HEAD_OPACITY) / SPINNER_ARC_STOP_COUNT;
		const tailStep = (SPINNER_ARC_TAIL_OPACITY - SPINNER_ARC_JOINT_OPACITY) / SPINNER_ARC_STOP_COUNT;

		expect(leadStep).toBeCloseTo(tailStep, 10);
		expect(SPINNER_ARC_JOINT_OPACITY).toBeCloseTo((SPINNER_ARC_HEAD_OPACITY + SPINNER_ARC_TAIL_OPACITY) / 2, 10);
		expect(lead.at(-1)?.opacity).toBe(tail.at(-1)?.opacity);
	});

	// Both halves terminate at the bottom of the ring. Meeting on one value is
	// what lets their butt caps abut without a seam — and what makes the round
	// caps they used to carry compound into a visible dot.
	test("brings the two half-rings to the same opacity where they meet", () => {
		const lead = spinnerArcStops(SPINNER_ARC_HEAD_OPACITY, SPINNER_ARC_JOINT_OPACITY);
		const tail = spinnerArcStops(SPINNER_ARC_TAIL_OPACITY, SPINNER_ARC_JOINT_OPACITY);
		expect(lead.at(-1)?.opacity).toBe(SPINNER_ARC_JOINT_OPACITY);
		expect(tail.at(-1)?.opacity).toBe(SPINNER_ARC_JOINT_OPACITY);
	});
});

describe("SPINNER_ARC_STROKE_WIDTH", () => {
	// The head cap is a circle of half this radius drawn at the top of the ring,
	// so an over-wide stroke would clip against the viewBox rather than warn.
	test("leaves the ring inside the 24-unit viewBox", () => {
		expect(ARC_RADIUS + SPINNER_ARC_STROKE_WIDTH / 2).toBeLessThanOrEqual(ARC_CENTRE);
	});
});
