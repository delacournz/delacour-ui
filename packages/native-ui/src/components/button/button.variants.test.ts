import { describe, expect, test } from "bun:test";
import { BUTTON_RADIUS_TOKENS, ICON_SIZE_TOKENS } from "../../styles/tokens";
import {
	BUTTON_FOREGROUND_TOKEN,
	BUTTON_SIZES,
	BUTTON_SPINNER_PLACEMENTS,
	BUTTON_VARIANTS,
	buttonVariants,
	resolveButtonLayout,
	resolveSpinnerSwapIndex,
} from "./button.variants";

/** The `--spacing-button-*` token a root class string sets its height from. */
function heightToken(cls: string): string | undefined {
	return cls.match(/\bh-(button-[\w-]+)\b/)?.[1];
}

/** The `--spacing-button-*` token a root class string sets its width from. */
function widthToken(cls: string): string | undefined {
	return cls.match(/\bw-(button-[\w-]+)\b/)?.[1];
}

/** The `--radius-*` token a root class string sets its corners from. */
function radiusToken(cls: string): string | undefined {
	return cls.match(/\brounded-([\w-]+)\b/)?.[1];
}

/**
 * Position of a slot's `size-icon-*` token on the shared icon scale.
 *
 * Compares by step rather than by points, so the test says what it means and
 * survives a token being retuned in `tokens.css`. `tokens.test.ts` keeps the
 * array ordered, and asserts the icon actually fits inside the button height.
 */
function iconStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

describe("buttonVariants root slot", () => {
	test("defaults to the primary md variant", () => {
		const cls = buttonVariants().root();
		expect(cls).toContain("bg-primary");
		expect(cls).toContain("h-button-md");
	});

	test("clips, so a pressed row fades to the edge of its own box", () => {
		expect(buttonVariants().root()).toContain("overflow-hidden");
	});

	test("gives every variant a distinct root treatment", () => {
		const seen = new Set(BUTTON_VARIANTS.map((variant) => buttonVariants({ variant }).root()));
		expect(seen.size).toBe(BUTTON_VARIANTS.length);
	});

	test("maps each variant to its surface", () => {
		expect(buttonVariants({ variant: "primary" }).root()).toContain("bg-primary");
		expect(buttonVariants({ variant: "secondary" }).root()).toContain("bg-secondary");
		expect(buttonVariants({ variant: "tertiary" }).root()).toContain("bg-tertiary");
		expect(buttonVariants({ variant: "danger" }).root()).toContain("bg-danger");
		expect(buttonVariants({ variant: "danger-soft" }).root()).toContain("bg-danger-soft");
	});

	test("outline draws a border, ghost does not", () => {
		expect(buttonVariants({ variant: "outline" }).root()).toContain("border-border");
		expect(buttonVariants({ variant: "outline" }).root()).toContain("bg-transparent");
		expect(buttonVariants({ variant: "ghost" }).root()).toContain("bg-transparent");
		expect(buttonVariants({ variant: "ghost" }).root()).toContain("border-transparent");
	});

	test("gives every size a distinct height", () => {
		const seen = new Set(BUTTON_SIZES.map((size) => buttonVariants({ size }).root()));
		expect(seen.size).toBe(BUTTON_SIZES.length);
		expect(buttonVariants({ size: "sm" }).root()).toContain("h-button-sm");
		expect(buttonVariants({ size: "md" }).root()).toContain("h-button-md");
		expect(buttonVariants({ size: "lg" }).root()).toContain("h-button-lg");
	});

	test("icon-only swaps horizontal padding for a square width", () => {
		for (const size of BUTTON_SIZES) {
			const iconOnly = buttonVariants({ isIconOnly: true, size }).root();
			expect(iconOnly).toMatch(/\bw-button-(sm|md|lg)\b/);
			expect(iconOnly).not.toMatch(/\bpx-\d/);
		}
		expect(buttonVariants({ isIconOnly: false, size: "md" }).root()).toMatch(/\bpx-\d/);
	});

	test("rounds by default, at the corner token paired with its size", () => {
		expect(radiusToken(buttonVariants().root())).toBe("button-md");
		for (const size of BUTTON_SIZES) {
			expect(radiusToken(buttonVariants({ size }).root())).toBe(`button-${size}`);
		}
	});

	test("names a corner token the CSS actually declares", () => {
		for (const size of BUTTON_SIZES) {
			expect(BUTTON_RADIUS_TOKENS).toContain(`button-${size}`);
		}
	});

	// The corner belongs to the size axis and nothing else, so no variant, and
	// no state, can leave a second `rounded-*` behind for tailwind-merge to
	// pick between.
	test("carries exactly one corner, whatever else is set", () => {
		for (const variant of BUTTON_VARIANTS) {
			for (const size of BUTTON_SIZES) {
				const cls = buttonVariants({ isDisabled: true, isIconOnly: true, isLoading: true, size, variant }).root();
				expect(cls.match(/\brounded-[\w-]+\b/g)).toHaveLength(1);
			}
		}
	});

	test("lets a caller square it off through className", () => {
		expect(radiusToken(buttonVariants().root({ className: "rounded-lg" }))).toBe("lg");
		expect(radiusToken(buttonVariants({ size: "lg" }).root({ className: "rounded-none" }))).toBe("none");
	});

	test("adds the disabled treatment only when disabled", () => {
		expect(buttonVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(buttonVariants({ isDisabled: false }).root()).not.toContain("opacity-50");
	});

	test("loading does not dim on its own, and dims only when asked", () => {
		expect(buttonVariants({ isLoading: true }).root()).not.toContain("opacity-50");
		expect(buttonVariants({ isDimmedWhileLoading: true }).root()).not.toContain("opacity-50");
		expect(buttonVariants({ isDimmedWhileLoading: true, isLoading: true }).root()).toContain("opacity-50");
	});

	test("disabled still dims regardless of loading state", () => {
		expect(buttonVariants({ isDisabled: true, isLoading: true }).root()).toContain("opacity-50");
		expect(buttonVariants({ isDimmedWhileLoading: false, isDisabled: true, isLoading: true }).root()).toContain(
			"opacity-50"
		);
	});

	test("neither loading flag touches the root's text colour rule", () => {
		expect(buttonVariants({ isDimmedWhileLoading: true, isLoading: true }).root()).not.toMatch(/\btext-(?!center\b)/);
	});

	test("merges an incoming className last", () => {
		expect(buttonVariants().root({ className: "bg-info" })).toContain("bg-info");
	});
});

describe("resolveButtonLayout", () => {
	test("shows no spinner when not loading, whatever the placement", () => {
		for (const spinnerPlacement of BUTTON_SPINNER_PLACEMENTS) {
			expect(resolveButtonLayout({ spinnerPlacement })).toEqual({
				isIconOnly: false,
				isSpinnerOnly: false,
				spinnerSide: null,
			});
		}
	});

	test("places the spinner on the side it was asked for", () => {
		expect(resolveButtonLayout({ isLoading: true, spinnerPlacement: "start" }).spinnerSide).toBe("start");
		expect(resolveButtonLayout({ isLoading: true, spinnerPlacement: "end" }).spinnerSide).toBe("end");
	});

	test("defaults to a start-placed spinner", () => {
		expect(resolveButtonLayout({ isLoading: true }).spinnerSide).toBe("start");
	});

	test("only replaces the content and leaves the footprint alone", () => {
		expect(resolveButtonLayout({ isLoading: true, spinnerPlacement: "only" })).toEqual({
			isIconOnly: false,
			isSpinnerOnly: true,
			spinnerSide: null,
		});
	});

	test("only leaves a stretched button unsquared", () => {
		// Squaring it would defeat the parent's `alignItems: stretch` and pin the
		// button to the left edge the moment it started loading.
		const layout = resolveButtonLayout({ isIconOnly: false, isLoading: true, spinnerPlacement: "only" });
		expect(layout.isIconOnly).toBe(false);
	});

	test("keeps an icon-only button square through every placement", () => {
		for (const spinnerPlacement of BUTTON_SPINNER_PLACEMENTS) {
			expect(resolveButtonLayout({ isIconOnly: true, isLoading: true, spinnerPlacement }).isIconOnly).toBe(true);
		}
	});

	test("never shows both a side spinner and replaced content", () => {
		for (const spinnerPlacement of BUTTON_SPINNER_PLACEMENTS) {
			const layout = resolveButtonLayout({ isLoading: true, spinnerPlacement });
			expect(layout.isSpinnerOnly && layout.spinnerSide !== null).toBe(false);
		}
	});
});

describe("resolveButtonLayout feeding buttonVariants", () => {
	test("a loading-only button keeps its padding and takes no fixed width", () => {
		for (const size of BUTTON_SIZES) {
			const layout = resolveButtonLayout({ isLoading: true, spinnerPlacement: "only" });
			const cls = buttonVariants({ isIconOnly: layout.isIconOnly, isLoading: true, size }).root();
			expect(cls).toMatch(/\bpx-\d/);
			expect(cls).not.toMatch(/\bw-button-/);
		}
	});

	test("an icon-only button still gets its square width while loading", () => {
		for (const size of BUTTON_SIZES) {
			const layout = resolveButtonLayout({ isIconOnly: true, isLoading: true, spinnerPlacement: "only" });
			const cls = buttonVariants({ isIconOnly: layout.isIconOnly, isLoading: true, size }).root();
			expect(cls).toMatch(/\bw-button-(sm|md|lg)\b/);
			expect(cls).not.toMatch(/\bpx-\d/);
		}
	});

	test("a start-placed spinner keeps the button's normal padding", () => {
		const layout = resolveButtonLayout({ isLoading: true, spinnerPlacement: "start" });
		const cls = buttonVariants({ isIconOnly: layout.isIconOnly, isLoading: true, size: "md" }).root();
		expect(cls).toMatch(/\bpx-4\b/);
		expect(cls).not.toMatch(/\bw-button-/);
	});
});

describe("buttonVariants label slot", () => {
	test("carries the text colour, which the root must not", () => {
		for (const variant of BUTTON_VARIANTS) {
			expect(buttonVariants({ variant }).label()).toMatch(/\btext-/);
			expect(buttonVariants({ variant }).root()).not.toMatch(/\btext-(?!center\b)/);
		}
	});

	test("pairs each surface with its own foreground", () => {
		expect(buttonVariants({ variant: "primary" }).label()).toContain("text-primary-foreground");
		expect(buttonVariants({ variant: "secondary" }).label()).toContain("text-secondary-foreground");
		expect(buttonVariants({ variant: "tertiary" }).label()).toContain("text-tertiary-foreground");
		expect(buttonVariants({ variant: "danger" }).label()).toContain("text-danger-foreground");
		expect(buttonVariants({ variant: "danger-soft" }).label()).toContain("text-danger-soft-foreground");
		expect(buttonVariants({ variant: "outline" }).label()).toContain("text-foreground");
		expect(buttonVariants({ variant: "ghost" }).label()).toContain("text-foreground");
	});

	test("scales label text with size", () => {
		expect(buttonVariants({ size: "sm" }).label()).toContain("text-button-sm");
		expect(buttonVariants({ size: "md" }).label()).toContain("text-button-md");
		expect(buttonVariants({ size: "lg" }).label()).toContain("text-button-lg");
	});
});

describe("buttonVariants content slots", () => {
	test("centre their subtree", () => {
		expect(buttonVariants().startContent()).toContain("items-center");
		expect(buttonVariants().endContent()).toContain("items-center");
	});

	test("do not vary, so a slot outside a Button is still styled", () => {
		for (const size of BUTTON_SIZES) {
			expect(buttonVariants({ size }).startContent()).toBe(buttonVariants().startContent());
			expect(buttonVariants({ size }).endContent()).toBe(buttonVariants().endContent());
		}
	});

	test("merge an incoming className", () => {
		expect(buttonVariants().startContent({ className: "gap-1" })).toContain("gap-1");
	});
});

describe("resolveSpinnerSwapIndex", () => {
	test("takes the first icon at the start and the last at the end", () => {
		const icons = [true, false, true];
		expect(resolveSpinnerSwapIndex(icons, "start")).toBe(0);
		expect(resolveSpinnerSwapIndex(icons, "end")).toBe(2);
	});

	test("finds an icon wherever it sits among the children", () => {
		expect(resolveSpinnerSwapIndex([false, false, true], "start")).toBe(2);
		expect(resolveSpinnerSwapIndex([true, false, false], "end")).toBe(0);
	});

	// With nothing to replace the spinner is inserted instead, which is what the
	// button did for every case before the swap existed.
	test("reports nothing to swap when no child is an icon", () => {
		expect(resolveSpinnerSwapIndex([false, false], "start")).toBeNull();
		expect(resolveSpinnerSwapIndex([], "end")).toBeNull();
	});

	test("takes the only icon from either side", () => {
		expect(resolveSpinnerSwapIndex([false, true], "start")).toBe(1);
		expect(resolveSpinnerSwapIndex([false, true], "end")).toBe(1);
	});
});

describe("buttonVariants icon slot", () => {
	test("gives every size a distinct icon token, increasing with it", () => {
		const steps = BUTTON_SIZES.map((size) => iconStep(buttonVariants({ size }).icon()));
		expect(steps).not.toContain(-1);
		expect(new Set(steps).size).toBe(BUTTON_SIZES.length);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	// The button indexes the shared icon scale at its own step name, which is
	// what makes a composed Icon and the Spinner that replaces it the same box.
	test("names the icon token matching the button's own size", () => {
		for (const size of BUTTON_SIZES) {
			expect(buttonVariants({ size }).icon()).toBe(`size-icon-${size}`);
		}
	});

	// An icon takes a colour value rather than a class — the slot sizes it only.
	test("carries no colour", () => {
		for (const size of BUTTON_SIZES) {
			expect(buttonVariants({ size }).icon()).not.toMatch(/\b(bg|text|border)-/);
		}
	});
});

describe("BUTTON_FOREGROUND_TOKEN", () => {
	test("names a foreground for every variant", () => {
		// Load-bearing for the Spinner's colour as well as the Icon's: a variant
		// missing here would leave a composed spinner untinted.
		for (const variant of BUTTON_VARIANTS) {
			expect(typeof BUTTON_FOREGROUND_TOKEN[variant]).toBe("string");
			expect(BUTTON_FOREGROUND_TOKEN[variant].length).toBeGreaterThan(0);
		}
	});
});

describe("an icon-only button's footprint", () => {
	test("is as wide as it is tall at every size", () => {
		// Both axes name the same button token, so the square cannot drift the
		// way two hand-picked numbers could.
		for (const size of BUTTON_SIZES) {
			const token = heightToken(buttonVariants({ size }).root());
			expect(token).toBeDefined();
			expect(widthToken(buttonVariants({ isIconOnly: true, size }).root())).toBe(token);
		}
	});
});
