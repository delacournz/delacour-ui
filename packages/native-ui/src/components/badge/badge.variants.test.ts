import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import {
	BADGE_COLORS,
	BADGE_FOREGROUND_TOKEN,
	BADGE_SIZES,
	BADGE_VARIANTS,
	badgeVariants,
	resolveBadgeInteractive,
} from "./badge.variants";

const THEME_CSS = readFileSync(join(import.meta.dirname, "../../styles/theme.css"), "utf-8");

/**
 * Every `--color-*` name declared under one `@variant` block.
 *
 * The same reader `navigation-theme.test.ts` uses. A token named by
 * {@link BADGE_FOREGROUND_TOKEN} but absent from a variant resolves to nothing,
 * and the icon is drawn in whatever colour the fallback happens to be — silent,
 * and only visible in one theme.
 */
function declaredColors(variant: "light" | "dark"): Set<string> {
	const block = THEME_CSS.split(`@variant ${variant} {`)[1]?.split("}")[0] ?? "";
	const names = new Set<string>();

	for (const [, name] of block.matchAll(/--color-([\w-]+):/g)) {
		names.add(name);
	}

	return names;
}

const LIGHT = declaredColors("light");
const DARK = declaredColors("dark");

/** Tailwind's spacing step a class string sets its horizontal padding from. */
function paddingX(cls: string): number {
	return Number(cls.match(/\bpx-([\d.]+)\b/)?.[1]);
}

/** Tailwind's spacing step a class string sets its vertical padding from. */
function paddingY(cls: string): number {
	return Number(cls.match(/\bpy-([\d.]+)\b/)?.[1]);
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

	test("clips, so a pressed badge fades to the edge of its own box", () => {
		expect(badgeVariants().root()).toContain("overflow-hidden");
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

	test("adds the disabled treatment only when disabled", () => {
		expect(badgeVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(badgeVariants({ isDisabled: false }).root()).not.toContain("opacity-50");
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
		for (const color of ["success", "warning", "danger", "info"] as const) {
			expect(badgeVariants({ variant: "solid", color }).label()).toContain(`text-${color}-foreground`);
		}
	});

	test("pairs every soft surface with its own soft foreground", () => {
		for (const color of ["success", "warning", "danger", "info"] as const) {
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

describe("resolveBadgeInteractive", () => {
	const noop = () => {};

	test("a badge with no handler stays a plain view", () => {
		expect(resolveBadgeInteractive({})).toBe(false);
	});

	test("either press handler upgrades it to a pressable", () => {
		expect(resolveBadgeInteractive({ onPress: noop })).toBe(true);
		expect(resolveBadgeInteractive({ onLongPress: noop })).toBe(true);
		expect(resolveBadgeInteractive({ onPress: noop, onLongPress: noop })).toBe(true);
	});
});
