import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import { BADGE_COLORS, BADGE_FOREGROUND_TOKEN, BADGE_SIZES, badgeVariants } from "../badge/badge.variants";
import {
	CHIP_CLOSE_HIT_SLOP,
	CHIP_COLORS,
	CHIP_FOREGROUND_TOKEN,
	CHIP_HIT_SLOP,
	CHIP_SIZES,
	CHIP_SURFACES,
	CHIP_VARIANTS,
	chipVariants,
	resolveChipForegroundToken,
	resolveChipMode,
	resolveChipSurface,
} from "./chip.variants";

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

/** Tailwind's spacing step a class string sets its gap from. */
function gapOf(cls: string): number {
	return Number(cls.match(/\bgap-([\d.]+)\b/)?.[1]);
}

/** Position of a label's font size on the type scale, largest last. */
const TEXT_SCALE = ["text-xs", "text-sm", "text-base", "text-lg"] as const;
function textStep(cls: string): number {
	return TEXT_SCALE.findIndex((step) => new RegExp(`\\b${step}\\b`).test(cls));
}

/** Position of a slot's `size-icon-*` token on the shared icon scale. */
function iconStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

/** The `text-*` colour token a label class string resolves to, minus the prefix. */
function labelColorToken(cls: string): string | undefined {
	return cls.match(/\btext-((?:[a-z]+-)*(?:foreground|background))\b/)?.[1];
}

/** The `bg-*` and `border-*` colour utilities of a root class string, sorted. */
function surfaceClasses(cls: string): string[] {
	return cls
		.split(/\s+/)
		.filter((c) => /^bg-/.test(c) || (/^border-/.test(c) && c !== "border"))
		.sort();
}

describe("the chip's axes", () => {
	// A chip and a badge sitting side by side in one row mean the same thing by
	// the same colour. A private colour list is how the two drift apart.
	test("share Badge's colours and sizes", () => {
		expect([...CHIP_COLORS]).toEqual([...BADGE_COLORS]);
		expect([...CHIP_SIZES]).toEqual([...BADGE_SIZES]);
	});

	// `solid` is what selection paints, so a resting solid chip would be
	// indistinguishable from a selected one.
	test("rest on soft or outline only — solid is reserved for selected", () => {
		expect([...CHIP_VARIANTS]).toEqual(["soft", "outline"]);
	});
});

describe("chipVariants root slot", () => {
	test("defaults to the soft default md chip", () => {
		const cls = chipVariants().root();
		expect(cls).toContain("bg-muted");
		expect(cls).toContain("px-3");
	});

	test("never stretches and is a capsule, at every size", () => {
		for (const size of CHIP_SIZES) {
			const cls = chipVariants({ size }).root();
			expect(cls).toContain("self-start");
			expect(cls).toContain("rounded-full");
		}
	});

	// Selecting a chip must not make it wider — in a wrapping row that would
	// reflow every chip after it.
	test("reserves the border in every state, so selection never resizes the box", () => {
		for (const variant of CHIP_VARIANTS) {
			for (const isSelected of [false, true]) {
				expect(chipVariants({ variant, isSelected }).root()).toMatch(/\bborder\b/);
			}
		}
	});

	test("clips, so a pressed chip fades to the edge of its own box", () => {
		expect(chipVariants().root()).toContain("overflow-hidden");
	});

	// Tone is shared with Badge: a resting chip is painted exactly as the
	// badge of the same variant and colour is.
	test("paints a resting chip as the matching badge", () => {
		for (const variant of CHIP_VARIANTS) {
			for (const color of CHIP_COLORS) {
				const chip = chipVariants({ variant, color });
				const badge = badgeVariants({ variant, color });
				expect(surfaceClasses(chip.root())).toEqual(surfaceClasses(badge.root()));
				expect(labelColorToken(chip.label())).toBe(labelColorToken(badge.label()));
			}
		}
	});

	test("paints a selected chip as a solid fill in its colour", () => {
		for (const color of ["primary", "success", "warning", "destructive", "info"] as const) {
			for (const variant of CHIP_VARIANTS) {
				const slots = chipVariants({ variant, color, isSelected: true });
				expect(slots.root()).toContain(`bg-${color}`);
				expect(slots.root()).toContain(`border-${color}`);
				expect(slots.label()).toContain(`text-${color}-foreground`);
			}
		}
	});

	// Badge's solid default is `secondary`, which this theme sets a hair from
	// `muted` — a selected default chip would look unselected. It inverts
	// instead.
	test("inverts a selected default chip rather than tinting it", () => {
		const slots = chipVariants({ color: "default", isSelected: true });
		expect(slots.root()).toContain("bg-foreground");
		expect(slots.label()).toContain("text-background");
	});

	test("reads the same when selected, whatever it rested on", () => {
		for (const color of CHIP_COLORS) {
			const soft = chipVariants({ variant: "soft", color, isSelected: true });
			const outline = chipVariants({ variant: "outline", color, isSelected: true });
			expect(surfaceClasses(soft.root())).toEqual(surfaceClasses(outline.root()));
			expect(soft.label()).toBe(outline.label());
		}
	});

	test("gives every surface and colour pair a distinct treatment", () => {
		const seen = new Set<string>();
		for (const surface of CHIP_SURFACES) {
			for (const color of CHIP_COLORS) {
				const slots =
					surface === "selected"
						? chipVariants({ color, isSelected: true })
						: chipVariants({ color, isSelected: false, variant: surface });
				seen.add(`${surfaceClasses(slots.root()).join(" ")}|${labelColorToken(slots.label())}`);
			}
		}
		expect(seen.size).toBe(CHIP_SURFACES.length * CHIP_COLORS.length);
	});

	test("adds the disabled treatment only when disabled", () => {
		expect(chipVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(chipVariants({ isDisabled: false }).root()).not.toContain("opacity-50");
	});

	test("merges an incoming className last", () => {
		expect(chipVariants().root({ className: "bg-info" })).toContain("bg-info");
		expect(chipVariants().root({ className: "bg-info" })).not.toContain("bg-muted");
	});
});

describe("chipVariants size axis", () => {
	test("scales horizontal padding, vertical padding and gap together", () => {
		const roots = CHIP_SIZES.map((size) => chipVariants({ size }).root());
		for (const scale of [roots.map(paddingX), roots.map(paddingY), roots.map(gapOf)]) {
			expect(scale.every(Number.isFinite)).toBe(true);
			expect(new Set(scale).size).toBe(CHIP_SIZES.length);
			expect([...scale]).toEqual([...scale].sort((a, b) => a - b));
		}
	});

	// A chip is something to aim at, so it is roomier than the badge of the
	// same size — never smaller.
	test("pads at least as generously as the badge of the same size", () => {
		for (const size of CHIP_SIZES) {
			const chip = chipVariants({ size }).root();
			const badge = badgeVariants({ size }).root();
			expect(paddingX(chip)).toBeGreaterThanOrEqual(paddingX(badge));
			expect(paddingY(chip)).toBeGreaterThanOrEqual(paddingY(badge));
		}
	});

	test("takes no height, so the label grows with OS font scaling", () => {
		for (const size of CHIP_SIZES) {
			expect(chipVariants({ size }).root()).not.toMatch(/\bh-/);
		}
	});

	test("scales label text with size, at medium weight", () => {
		const labels = CHIP_SIZES.map((size) => chipVariants({ size }).label());
		const steps = labels.map(textStep);
		expect(steps.every((step) => step >= 0)).toBe(true);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
		for (const label of labels) expect(label).toContain("font-medium");
	});

	test("matches Badge's icon step at every size", () => {
		for (const size of CHIP_SIZES) {
			const step = iconStep(chipVariants({ size }).icon());
			expect(step).toBeGreaterThanOrEqual(0);
			expect(step).toBe(iconStep(badgeVariants({ size }).icon()));
		}
	});

	test("the label slot carries the text colour, which the root must not", () => {
		for (const variant of CHIP_VARIANTS) {
			for (const color of CHIP_COLORS) {
				for (const isSelected of [false, true]) {
					const slots = chipVariants({ variant, color, isSelected });
					expect(labelColorToken(slots.label())).toBeDefined();
					expect(slots.root()).not.toMatch(/\btext-(?!center\b)/);
				}
			}
		}
	});
});

describe("resolveChipSurface", () => {
	test("selection wins over the resting variant", () => {
		expect(resolveChipSurface({ variant: "soft", isSelected: true })).toBe("selected");
		expect(resolveChipSurface({ variant: "outline", isSelected: true })).toBe("selected");
	});

	test("an unselected chip rests on its variant", () => {
		expect(resolveChipSurface({ variant: "soft", isSelected: false })).toBe("soft");
		expect(resolveChipSurface({ variant: "outline", isSelected: false })).toBe("outline");
	});
});

describe("CHIP_FOREGROUND_TOKEN", () => {
	test("reuses Badge's tokens for the resting surfaces", () => {
		expect(CHIP_FOREGROUND_TOKEN.soft).toEqual(BADGE_FOREGROUND_TOKEN.soft);
		expect(CHIP_FOREGROUND_TOKEN.outline).toEqual(BADGE_FOREGROUND_TOKEN.outline);
	});

	// A composed Icon sits beside the label; two maps that can drift is how a
	// chip ends up with a grey glyph beside white text.
	test("matches the colour its own label slot resolves to, in every state", () => {
		for (const variant of CHIP_VARIANTS) {
			for (const color of CHIP_COLORS) {
				for (const isSelected of [false, true]) {
					const label = chipVariants({ variant, color, isSelected }).label();
					expect(labelColorToken(label)).toBe(resolveChipForegroundToken({ variant, color, isSelected }));
				}
			}
		}
	});

	test("names only tokens both themes declare", () => {
		for (const surface of CHIP_SURFACES) {
			for (const color of CHIP_COLORS) {
				const token = CHIP_FOREGROUND_TOKEN[surface][color];
				expect(LIGHT.has(token)).toBe(true);
				expect(DARK.has(token)).toBe(true);
			}
		}
	});
});

describe("resolveChipMode", () => {
	const noop = () => {};

	test("a chip with nothing to do stays a plain view", () => {
		expect(resolveChipMode({})).toBe("static");
	});

	test("a press handler makes it a button", () => {
		expect(resolveChipMode({ onPress: noop })).toBe("button");
		expect(resolveChipMode({ onLongPress: noop })).toBe("button");
	});

	// Setting `isSelected` — even to false — says the chip has an on state, and
	// a screen reader has to hear which one it is in.
	test("any selection prop makes it a toggle, whatever else is set", () => {
		expect(resolveChipMode({ isSelected: false })).toBe("toggle");
		expect(resolveChipMode({ isSelected: true })).toBe("toggle");
		expect(resolveChipMode({ defaultSelected: false })).toBe("toggle");
		expect(resolveChipMode({ onSelectedChange: noop })).toBe("toggle");
		expect(resolveChipMode({ isSelected: false, onPress: noop })).toBe("toggle");
	});
});

describe("hit slop", () => {
	// Chips wrap in rows eight points apart (`gap-2`). More than four points
	// of vertical slop reaches into the next row and makes a tap ambiguous.
	test("the root never reaches past half a gap-2 row gap", () => {
		for (const size of CHIP_SIZES) {
			const slop = CHIP_HIT_SLOP[size];
			expect(slop.top).toBeLessThanOrEqual(4);
			expect(slop.bottom).toBeLessThanOrEqual(4);
			expect(slop.left).toBe(0);
			expect(slop.right).toBe(0);
		}
	});

	test("the close glyph grows its target with the chip", () => {
		const slops = CHIP_SIZES.map((size) => CHIP_CLOSE_HIT_SLOP[size]);
		expect(slops.every((slop) => slop > 0)).toBe(true);
		expect([...slops]).toEqual([...slops].sort((a, b) => a - b));
	});
});
