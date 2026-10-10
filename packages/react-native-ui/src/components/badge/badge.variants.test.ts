import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import {
	BADGE_COLORS,
	BADGE_FOREGROUND_TOKEN,
	BADGE_PLACEMENTS,
	BADGE_SIZES,
	BADGE_SURFACE_CELLS,
	BADGE_VARIANTS,
	badgeVariants,
	resolveBadgeCount,
	resolveBadgeShape,
} from "./badge.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** Tailwind's spacing step a class string sets its horizontal padding from. */
function paddingX(cls: string): number {
	return Number(cls.match(/\bpx-([\d.]+)\b/)?.[1]);
}

/** Tailwind's spacing step a class string sets its vertical padding from. */
function paddingY(cls: string): number {
	return Number(cls.match(/\bpy-([\d.]+)\b/)?.[1]);
}

/** Tailwind's spacing step a class string sets its minimum width from. */
function minWidth(cls: string): number {
	return Number(cls.match(/\bmin-w-([\d.]+)\b/)?.[1]);
}

/** Tailwind's spacing step a class string sets its square edge from. */
function edgeOf(cls: string): number {
	return Number(cls.match(/\bsize-([\d.]+)\b/)?.[1]);
}

/** The `bg-*` utility a root class string paints with. */
function fillOf(cls: string): string | undefined {
	return cls.match(/\bbg-[\w-]+\b/)?.[0];
}

/** Tailwind's spacing step a class string sets its gap from. */
function gapOf(cls: string): number {
	return Number(cls.match(/\bgap-([\d.]+)\b/)?.[1]);
}

/**
 * Position of a label's font size on the type scale, largest last.
 *
 * Compares by step rather than by points so the test says what it means and
 * survives a size being retuned in `tokens.css`.
 */
const TEXT_SCALE = ["text-xs", "text-sm", "text-base", "text-lg"] as const;
function textStep(cls: string): number {
	return TEXT_SCALE.findIndex((step) => new RegExp(`\\b${step}\\b`).test(cls));
}

/**
 * Position of a slot's `size-icon-*` token on the shared icon scale.
 *
 * The same helper `button.variants.test.ts` uses — a badge's glyph has to sit on
 * the scale `Icon` and `Spinner` share, not carry a private number.
 */
function iconStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

/** The `text-*` colour token a label class string resolves to, minus the prefix. */
function labelColorToken(cls: string): string | undefined {
	return cls.match(/\btext-((?:[a-z]+-)*(?:foreground|background))\b/)?.[1];
}

describe("the theme.css reader", () => {
	// The token assertions below are only worth anything if the parse found something.
	test("finds both variants", () => {
		expect(LIGHT.size).toBeGreaterThan(0);
		expect(DARK.size).toBeGreaterThan(0);
	});
});

describe("badgeVariants root slot", () => {
	test("defaults to the solid default md badge", () => {
		const cls = badgeVariants().root();
		expect(cls).toContain("bg-secondary");
		expect(cls).toContain("px-2.5");
	});

	// A badge is sized by its content. Inside a gap column every child is
	// stretch-aligned by default, so without this a one-word badge spans the
	// whole screen.
	test("never stretches, at every size", () => {
		for (const size of BADGE_SIZES) {
			expect(badgeVariants({ size }).root()).toContain("self-start");
		}
	});

	test("is a capsule at every size", () => {
		for (const size of BADGE_SIZES) {
			expect(badgeVariants({ size }).root()).toContain("rounded-full");
		}
	});

	// The border is always in the box, transparent until `outline` colours it.
	// Declaring it only on `outline` would make the badge two points wider the
	// moment a caller switched variant.
	test("reserves the border on every variant, so outline does not resize the box", () => {
		for (const variant of BADGE_VARIANTS) {
			expect(badgeVariants({ variant }).root()).toMatch(/\bborder\b/);
		}
		expect(badgeVariants({ variant: "solid" }).root()).toContain("border-transparent");
	});

	test("only outline names a border colour", () => {
		for (const color of BADGE_COLORS) {
			expect(badgeVariants({ variant: "outline", color }).root()).not.toContain("border-transparent");
			for (const variant of ["solid", "soft", "ghost"] as const) {
				expect(badgeVariants({ variant, color }).root()).toContain("border-transparent");
			}
		}
	});

	test("ghost paints no background, solid and soft do", () => {
		for (const color of BADGE_COLORS) {
			expect(badgeVariants({ variant: "ghost", color }).root()).toContain("bg-transparent");
			expect(badgeVariants({ variant: "outline", color }).root()).toContain("bg-transparent");
			expect(badgeVariants({ variant: "solid", color }).root()).not.toContain("bg-transparent");
			expect(badgeVariants({ variant: "soft", color }).root()).not.toContain("bg-transparent");
		}
	});

	// Every cell of the matrix has to be reachable. Two cells collapsing means a
	// caller can set an axis and see nothing change.
	test("gives all twenty-four variant and colour pairs a distinct treatment", () => {
		const seen = new Set<string>();

		for (const variant of BADGE_VARIANTS) {
			for (const color of BADGE_COLORS) {
				const slots = badgeVariants({ variant, color });
				seen.add(`${slots.root()}|${slots.label()}`);
			}
		}

		expect(seen.size).toBe(BADGE_VARIANTS.length * BADGE_COLORS.length);
	});

	test("merges an incoming className last", () => {
		expect(badgeVariants().root({ className: "bg-info" })).toContain("bg-info");
		expect(badgeVariants().root({ className: "bg-info" })).not.toContain("bg-secondary");
	});
});

describe("badgeVariants size axis", () => {
	test("scales horizontal padding, vertical padding and gap together", () => {
		const roots = BADGE_SIZES.map((size) => badgeVariants({ size }).root());
		const x = roots.map(paddingX);
		const y = roots.map(paddingY);
		const gaps = roots.map(gapOf);

		for (const scale of [x, y, gaps]) {
			expect(scale.every(Number.isFinite)).toBe(true);
			expect(new Set(scale).size).toBe(BADGE_SIZES.length);
			expect([...scale]).toEqual([...scale].sort((a, b) => a - b));
		}
	});

	// Padding, never a height. `Text` respects OS font scaling, and a fixed
	// height clips the label at a large accessibility step instead of growing
	// with it. Unlike `h-button-*`, a badge lines up against no chrome.
	test("takes no height, so the label grows with OS font scaling", () => {
		for (const size of BADGE_SIZES) {
			expect(badgeVariants({ size }).root()).not.toMatch(/\bh-/);
		}
	});
});

describe("badgeVariants label slot", () => {
	test("carries the text colour, which the root must not", () => {
		for (const variant of BADGE_VARIANTS) {
			for (const color of BADGE_COLORS) {
				const slots = badgeVariants({ variant, color });
				expect(labelColorToken(slots.label())).toBeDefined();
				expect(slots.root()).not.toMatch(/\btext-(?!center\b)/);
			}
		}
	});

	test("pairs every solid surface with its own foreground", () => {
		for (const color of ["success", "warning", "destructive", "info"] as const) {
			expect(badgeVariants({ variant: "solid", color }).label()).toContain(`text-${color}-foreground`);
		}
	});

	test("pairs every soft surface with its own soft foreground", () => {
		for (const color of ["success", "warning", "destructive", "info"] as const) {
			const slots = badgeVariants({ variant: "soft", color });
			expect(slots.root()).toContain(`bg-${color}-soft`);
			expect(slots.label()).toContain(`text-${color}-soft-foreground`);
		}
	});

	test("scales label text with size", () => {
		const steps = BADGE_SIZES.map((size) => textStep(badgeVariants({ size }).label()));
		expect(steps.every((step) => step >= 0)).toBe(true);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	test("is medium weight at every size", () => {
		for (const size of BADGE_SIZES) {
			expect(badgeVariants({ size }).label()).toContain("font-medium");
		}
	});
});

describe("badgeVariants icon slot", () => {
	test("gives every size a distinct icon token, increasing with it", () => {
		const steps = BADGE_SIZES.map((size) => iconStep(badgeVariants({ size }).icon()));
		expect(steps.every((step) => step >= 0)).toBe(true);
		expect(new Set(steps).size).toBe(BADGE_SIZES.length);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	// Colour arrives through BADGE_FOREGROUND_TOKEN, not through this class —
	// an SVG paint prop cannot be reached by a utility.
	test("carries no colour", () => {
		for (const size of BADGE_SIZES) {
			expect(badgeVariants({ size }).icon()).not.toMatch(/\btext-/);
		}
	});
});

describe("BADGE_FOREGROUND_TOKEN", () => {
	test("names a token for every variant and colour pair", () => {
		for (const variant of BADGE_VARIANTS) {
			for (const color of BADGE_COLORS) {
				expect(BADGE_FOREGROUND_TOKEN[variant][color]).toBeTruthy();
			}
		}
	});

	// A composed Icon and the label sit side by side. Resolving them from two
	// maps that can drift is how a badge ends up with a grey glyph beside white
	// text on a coloured surface.
	test("matches the colour its own label slot resolves to", () => {
		for (const variant of BADGE_VARIANTS) {
			for (const color of BADGE_COLORS) {
				const label = badgeVariants({ variant, color }).label();
				expect(labelColorToken(label)).toBe(BADGE_FOREGROUND_TOKEN[variant][color]);
			}
		}
	});

	test("names only tokens both themes declare", () => {
		for (const variant of BADGE_VARIANTS) {
			for (const color of BADGE_COLORS) {
				const token = BADGE_FOREGROUND_TOKEN[variant][color];
				expect(LIGHT.has(token)).toBe(true);
				expect(DARK.has(token)).toBe(true);
			}
		}
	});
});

describe("BADGE_SURFACE_CELLS", () => {
	// Chip builds its resting surfaces from these, so a gap here is a chip with
	// no paint rather than a test that fails beside the mistake.
	test("holds one cell for every variant and colour pair", () => {
		for (const variant of BADGE_VARIANTS) {
			expect(BADGE_SURFACE_CELLS[variant].map((cell) => cell.color)).toEqual([...BADGE_COLORS]);
			for (const cell of BADGE_SURFACE_CELLS[variant]) expect(cell.variant).toBe(variant);
		}
	});
});

describe("resolveBadgeShape", () => {
	test("a badge with content is a label", () => {
		expect(resolveBadgeShape({ hasChildren: true })).toBe("label");
	});

	test("a badge given a count is a count, whatever else it holds", () => {
		expect(resolveBadgeShape({ count: 3, hasChildren: false })).toBe("count");
		expect(resolveBadgeShape({ count: 0, hasChildren: false })).toBe("count");
		expect(resolveBadgeShape({ count: 3, hasChildren: true })).toBe("count");
	});

	// The rule `Avatar.Badge` follows: empty, it is a dot.
	test("a badge with nothing in it is a dot", () => {
		expect(resolveBadgeShape({ hasChildren: false })).toBe("dot");
	});
});

describe("resolveBadgeCount", () => {
	test("reads a count back as written", () => {
		expect(resolveBadgeCount({ count: 1 })).toBe("1");
		expect(resolveBadgeCount({ count: 99 })).toBe("99");
	});

	test("caps at 99 by default", () => {
		expect(resolveBadgeCount({ count: 100 })).toBe("99+");
		expect(resolveBadgeCount({ count: 12_345 })).toBe("99+");
	});

	test("caps at a caller's own maximum", () => {
		expect(resolveBadgeCount({ count: 9, max: 9 })).toBe("9");
		expect(resolveBadgeCount({ count: 10, max: 9 })).toBe("9+");
		expect(resolveBadgeCount({ count: 1000, max: 999 })).toBe("999+");
	});

	// Nothing to report is nothing to draw: a zero that stayed on screen would
	// pull the eye to an inbox with nothing in it.
	test("hides at zero unless asked to show it", () => {
		expect(resolveBadgeCount({ count: 0 })).toBeNull();
		expect(resolveBadgeCount({ count: 0, showZero: true })).toBe("0");
	});

	test("hides a count that is not a count", () => {
		expect(resolveBadgeCount({ count: -3 })).toBeNull();
		expect(resolveBadgeCount({ count: Number.NaN })).toBeNull();
		expect(resolveBadgeCount({ count: -3, showZero: true })).toBe("0");
	});

	test("drops a fraction rather than printing it", () => {
		expect(resolveBadgeCount({ count: 2.9 })).toBe("2");
	});
});

describe("badgeVariants count shape", () => {
	// One digit should sit in a circle, and that takes a floor on the width —
	// the box is otherwise as narrow as a `1`.
	test("floors the width at every size, increasing with it", () => {
		const floors = BADGE_SIZES.map((size) => minWidth(badgeVariants({ shape: "count", size }).root()));
		expect(floors.every(Number.isFinite)).toBe(true);
		expect(new Set(floors).size).toBe(BADGE_SIZES.length);
		expect([...floors]).toEqual([...floors].sort((a, b) => a - b));
	});

	test("pads tighter than the label of the same size", () => {
		for (const size of BADGE_SIZES) {
			const count = badgeVariants({ shape: "count", size }).root();
			const label = badgeVariants({ shape: "label", size }).root();
			expect(paddingX(count)).toBeLessThan(paddingX(label));
			expect(paddingY(count)).toBeLessThan(paddingY(label));
		}
	});

	test("still takes no height, so the number grows with OS font scaling", () => {
		for (const size of BADGE_SIZES) {
			expect(badgeVariants({ shape: "count", size }).root()).not.toMatch(/\bh-/);
		}
	});

	test("is painted by variant and colour exactly as a label is", () => {
		for (const variant of BADGE_VARIANTS) {
			for (const color of BADGE_COLORS) {
				const count = badgeVariants({ color, shape: "count", variant });
				const label = badgeVariants({ color, shape: "label", variant });
				expect(fillOf(count.root())).toBe(fillOf(label.root()));
				expect(count.label()).toBe(label.label());
			}
		}
	});
});

describe("badgeVariants dot shape", () => {
	test("is a square edge at every size, increasing with it", () => {
		const edges = BADGE_SIZES.map((size) => edgeOf(badgeVariants({ shape: "dot", size }).root()));
		expect(edges.every(Number.isFinite)).toBe(true);
		expect(new Set(edges).size).toBe(BADGE_SIZES.length);
		expect([...edges]).toEqual([...edges].sort((a, b) => a - b));
	});

	test("carries no padding and no border, so the edge is the whole dot", () => {
		for (const size of BADGE_SIZES) {
			const cls = badgeVariants({ shape: "dot", size }).root();
			expect(cls).toContain("p-0");
			expect(cls).toContain("border-0");
			expect(cls).not.toMatch(/\bp[xy]-/);
		}
	});

	test("gives every colour a distinct fill", () => {
		const fills = BADGE_COLORS.map((color) => fillOf(badgeVariants({ color, shape: "dot" }).root()));
		expect(fills.every(Boolean)).toBe(true);
		expect(new Set(fills).size).toBe(BADGE_COLORS.length);
	});

	// A dot has no surface to paint four ways — soft would be a tint six points
	// wide and ghost would be nothing at all.
	test("is the same solid dot on every variant", () => {
		for (const color of BADGE_COLORS) {
			const fills = BADGE_VARIANTS.map((variant) => fillOf(badgeVariants({ color, shape: "dot", variant }).root()));
			expect(new Set(fills).size).toBe(1);
			expect(fills[0]).not.toBe("bg-transparent");
		}
	});

	// `secondary` sits a hair from the page in this theme. A default dot painted
	// with it is a dot nobody sees.
	test("paints a default dot in the foreground, not in secondary", () => {
		expect(badgeVariants({ shape: "dot" }).root()).toContain("bg-foreground");
		expect(badgeVariants({ shape: "dot" }).root()).not.toContain("bg-secondary");
	});
});

describe("badgeVariants placement axis", () => {
	test("leaves an unplaced badge in the flow", () => {
		expect(badgeVariants().root()).not.toContain("absolute");
	});

	test("lifts a placed badge out of the flow, at every corner", () => {
		for (const placement of BADGE_PLACEMENTS) {
			expect(badgeVariants({ placement }).root()).toContain("absolute");
		}
	});

	test("gives every corner a distinct position", () => {
		const seen = new Set(BADGE_PLACEMENTS.map((placement) => badgeVariants({ placement }).root()));
		expect(seen.size).toBe(BADGE_PLACEMENTS.length);
	});

	// Pinned by the edge nearest the anchor's centre, so a count that gains a
	// digit grows away from the glyph instead of across it.
	test("pins the inner edge, so a longer count grows outward", () => {
		expect(badgeVariants({ placement: "top-right" }).root()).toContain("left-full");
		expect(badgeVariants({ placement: "bottom-right" }).root()).toContain("left-full");
		expect(badgeVariants({ placement: "top-left" }).root()).toContain("right-full");
		expect(badgeVariants({ placement: "bottom-left" }).root()).toContain("right-full");
	});

	// A dot is a third the size of a count. The overlap that tucks a count onto
	// a corner would bury a dot inside it.
	test("overlaps the corner less for a dot than for a count", () => {
		const overlap = (cls: string): number => Number(cls.match(/-m[lr]-([\d.]+)\b/)?.[1]);
		for (const placement of BADGE_PLACEMENTS) {
			const dot = overlap(badgeVariants({ placement, shape: "dot" }).root());
			const count = overlap(badgeVariants({ placement, shape: "count" }).root());
			expect(Number.isFinite(dot)).toBe(true);
			expect(dot).toBeLessThan(count);
		}
	});
});

describe("badgeVariants anchor slot", () => {
	// The same reason the root carries it: stretched across a column, the corner
	// a badge is pinned to is the far edge of the screen.
	test("is sized by what it holds", () => {
		expect(badgeVariants().anchor()).toContain("self-start");
	});

	// Yoga caps an absolute child at its parent's width when the parent is a
	// column, so a `99+` pinned over a 24pt glyph wrapped onto two lines. A row
	// measures it unconstrained. Seen on a simulator.
	test("is a row, so a count wider than the glyph does not wrap", () => {
		expect(badgeVariants().anchor()).toContain("flex-row");
	});
});
