import { describe, expect, test } from "bun:test";
import { ICON_SIZES } from "../icon/icon.variants";
import {
	FAB_DIAL_STAGGER,
	FAB_FOREGROUND_TOKEN,
	FAB_ICON_SIZE,
	FAB_PLACEMENTS,
	FAB_SIZES,
	FAB_VARIANTS,
	fabVariants,
	resolveDialProgress,
	resolveFabIconSize,
	resolveFabPlacementStyle,
	resolveLabelSide,
} from "./fab.variants";

describe("resolveDialProgress", () => {
	const count = 4;
	const stagger = FAB_DIAL_STAGGER;

	test("every action is fully closed at 0 and fully open at 1", () => {
		for (let index = 0; index < count; index++) {
			expect(resolveDialProgress({ open: 0, index, count, stagger })).toBe(0);
			expect(resolveDialProgress({ open: 1, index, count, stagger })).toBe(1);
		}
	});

	test("rises monotonically with the spring, for every action", () => {
		for (let index = 0; index < count; index++) {
			let previous = -1;
			for (let step = 0; step <= 100; step++) {
				const value = resolveDialProgress({ open: step / 100, index, count, stagger });
				expect(value).toBeGreaterThanOrEqual(previous);
				previous = value;
			}
		}
	});

	test("stays within 0..1 when the spring overshoots either end", () => {
		for (let index = 0; index < count; index++) {
			expect(resolveDialProgress({ open: 1.15, index, count, stagger })).toBe(1);
			expect(resolveDialProgress({ open: -0.1, index, count, stagger })).toBe(0);
		}
	});

	test("staggers: the action nearest the trigger leads the one beyond it", () => {
		const nearest = resolveDialProgress({ open: 0.3, index: 0, count, stagger });
		const farthest = resolveDialProgress({ open: 0.3, index: count - 1, count, stagger });
		expect(nearest).toBeGreaterThan(farthest);
	});

	test("the last action has not started before its window opens", () => {
		const start = (count - 1) * stagger;
		expect(resolveDialProgress({ open: start, index: count - 1, count, stagger })).toBe(0);
	});

	test("a lone action follows the spring exactly", () => {
		for (const open of [0, 0.25, 0.5, 0.75, 1]) {
			expect(resolveDialProgress({ open, index: 0, count: 1, stagger })).toBeCloseTo(open);
		}
	});

	test("a stagger of zero puts every action on the spring", () => {
		for (let index = 0; index < count; index++) {
			expect(resolveDialProgress({ open: 0.4, index, count, stagger: 0 })).toBeCloseTo(0.4);
		}
	});

	// A stagger wide enough to leave the last action no window would divide by
	// zero or less, and a NaN written into a style freezes the action in place.
	test("never yields NaN, even when the stagger eats the whole window", () => {
		for (let index = 0; index < 20; index++) {
			for (const open of [0, 0.5, 1]) {
				const value = resolveDialProgress({ open, index, count: 20, stagger });
				expect(Number.isNaN(value)).toBe(false);
				expect(value).toBeGreaterThanOrEqual(0);
				expect(value).toBeLessThanOrEqual(1);
			}
		}
	});
});

describe("resolveFabPlacementStyle", () => {
	test("pins bottom-end to the trailing edge, lifted by the offset and the inset", () => {
		expect(resolveFabPlacementStyle({ placement: "bottom-end", offset: 16, insetBottom: 34 })).toEqual({
			position: "absolute",
			bottom: 50,
			end: 16,
		});
	});

	test("pins bottom-start to the leading edge", () => {
		expect(resolveFabPlacementStyle({ placement: "bottom-start", offset: 16, insetBottom: 0 })).toEqual({
			position: "absolute",
			bottom: 16,
			start: 16,
		});
	});

	// Centred by spanning the row and centring inside it — `alignSelf` on an
	// absolute child is read against the parent's cross axis, which is
	// horizontal only in a column.
	test("centres bottom-center by spanning the row", () => {
		expect(resolveFabPlacementStyle({ placement: "bottom-center", offset: 24, insetBottom: 10 })).toEqual({
			position: "absolute",
			bottom: 34,
			start: 0,
			end: 0,
			alignItems: "center",
		});
	});

	test("uses logical edges only, so a right-to-left layout flips with no code", () => {
		for (const placement of FAB_PLACEMENTS) {
			const style = resolveFabPlacementStyle({ placement, offset: 16, insetBottom: 0 });
			expect(style).not.toHaveProperty("left");
			expect(style).not.toHaveProperty("right");
		}
	});
});

describe("resolveFabIconSize", () => {
	test("maps sm to icon-md and both larger sizes to icon-lg", () => {
		expect(resolveFabIconSize("sm")).toBe("md");
		expect(resolveFabIconSize("md")).toBe("lg");
		expect(resolveFabIconSize("lg")).toBe("lg");
	});

	test("names a step on the shared icon scale for every size", () => {
		for (const size of FAB_SIZES) {
			expect(ICON_SIZES).toContain(resolveFabIconSize(size));
			expect(FAB_ICON_SIZE[size]).toBe(resolveFabIconSize(size));
		}
	});
});

describe("resolveLabelSide", () => {
	test("puts the label chip on the side facing the screen", () => {
		expect(resolveLabelSide("bottom-end")).toBe("start");
		expect(resolveLabelSide("bottom-start")).toBe("end");
		expect(resolveLabelSide("bottom-center")).toBe("top");
	});
});

describe("FAB_FOREGROUND_TOKEN", () => {
	test("pairs every variant with the foreground of its own surface", () => {
		expect(FAB_FOREGROUND_TOKEN).toEqual({
			primary: "primary-foreground",
			secondary: "secondary-foreground",
			surface: "elevated-foreground",
			destructive: "destructive-foreground",
		});
	});
});

describe("fabVariants", () => {
	const classes = (value: string) => value.split(/\s+/).filter(Boolean);

	test("a round fab is a square footprint off the fab token, fully rounded", () => {
		const sizes = { sm: "size-fab-sm", md: "size-fab-md", lg: "size-fab-lg" } as const;
		for (const size of FAB_SIZES) {
			const root = classes(fabVariants({ size }).root());
			expect(root).toContain(sizes[size]);
			expect(root).toContain("rounded-full");
		}
	});

	test("an extended fab takes the height and pads its sides instead of fixing a width", () => {
		const heights = { sm: "h-fab-sm", md: "h-fab-md", lg: "h-fab-lg" } as const;
		for (const size of FAB_SIZES) {
			const root = classes(fabVariants({ size, isExtended: true }).root());
			expect(root).toContain(heights[size]);
			expect(root).toContain("px-5");
			expect(root).toContain("gap-2");
			expect(root.some((name) => name.startsWith("size-"))).toBe(false);
		}
	});

	test("fills each variant from its own semantic surface", () => {
		const fills = {
			primary: "bg-primary",
			secondary: "bg-secondary",
			surface: "bg-elevated",
			destructive: "bg-destructive",
		} as const;
		for (const variant of FAB_VARIANTS) {
			expect(classes(fabVariants({ variant }).root())).toContain(fills[variant]);
		}
		expect(classes(fabVariants({ variant: "surface" }).root())).toContain("border-border");
	});

	test("colours the label to match the variant's foreground token", () => {
		for (const variant of FAB_VARIANTS) {
			expect(classes(fabVariants({ variant }).label())).toContain(`text-${FAB_FOREGROUND_TOKEN[variant]}`);
		}
	});

	// Rule 1: a View does not cascade colour to its Text.
	test("puts no text colour on the root", () => {
		for (const variant of FAB_VARIANTS) {
			const root = classes(fabVariants({ variant }).root());
			expect(root.some((name) => /^text-(primary|secondary|elevated|destructive)/.test(name))).toBe(false);
		}
	});

	test("the label reads on the button's type scale", () => {
		const label = classes(fabVariants({}).label());
		expect(label).toContain("text-button-md");
		expect(label).toContain("font-medium");
	});

	test("casts a shadow — the one floating thing in the kit", () => {
		expect(classes(fabVariants({}).root())).toContain("shadow-lg");
		expect(classes(fabVariants({}).actionButton())).toContain("shadow-lg");
	});

	test("fades when disabled", () => {
		expect(classes(fabVariants({ isDisabled: true }).root())).toContain("opacity-50");
		expect(classes(fabVariants({ isDisabled: false }).root())).not.toContain("opacity-50");
	});

	test("the scrim covers its container in the overlay token", () => {
		const scrim = classes(fabVariants({}).scrim());
		expect(scrim).toContain("absolute");
		expect(scrim).toContain("inset-0");
		expect(scrim).toContain("bg-overlay");
	});

	test("an action button is a small round surface", () => {
		const button = classes(fabVariants({}).actionButton());
		expect(button).toContain("size-fab-sm");
		expect(button).toContain("rounded-full");
		expect(button).toContain("bg-elevated");
		expect(button).toContain("border-border");
	});

	test("an action's label chip sits on the popover surface", () => {
		const chip = classes(fabVariants({}).actionLabel());
		for (const name of ["bg-popover", "rounded-md", "px-2", "py-1"]) expect(chip).toContain(name);
		expect(classes(fabVariants({}).actionLabelText())).toContain("text-popover-foreground");
		expect(classes(fabVariants({}).actionLabelText())).toContain("text-sm");
	});

	test("the dial and each action are spaced by 12pt", () => {
		expect(classes(fabVariants({}).dial())).toContain("gap-3");
		expect(classes(fabVariants({}).action())).toContain("gap-3");
	});

	test("an action's anchor matches the trigger's width, so the two share a centre line", () => {
		const anchors = { sm: "w-fab-sm", md: "w-fab-md", lg: "w-fab-lg" } as const;
		for (const size of FAB_SIZES) {
			expect(classes(fabVariants({ size }).actionAnchor())).toContain(anchors[size]);
		}
	});

	test("lays an action out by the side its label sits on", () => {
		expect(classes(fabVariants({ labelSide: "start" }).action())).toContain("flex-row");
		expect(classes(fabVariants({ labelSide: "end" }).action())).toContain("flex-row-reverse");
		expect(classes(fabVariants({ labelSide: "top" }).action())).toContain("flex-col");
	});

	test("aligns the dial with the trigger's edge", () => {
		expect(classes(fabVariants({ labelSide: "start" }).dial())).toContain("items-end");
		expect(classes(fabVariants({ labelSide: "end" }).dial())).toContain("items-start");
		expect(classes(fabVariants({ labelSide: "top" }).dial())).toContain("items-center");
	});
});
