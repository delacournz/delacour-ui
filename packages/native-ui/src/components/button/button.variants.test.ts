import { describe, expect, test } from "bun:test";
import {
	BUTTON_FOREGROUND_TOKEN,
	BUTTON_ICON_SIZE,
	BUTTON_SIZES,
	BUTTON_SPINNER_PLACEMENTS,
	BUTTON_VARIANTS,
	buttonLabelVariants,
	buttonVariants,
	resolveButtonLayout,
} from "./button.variants";

describe("buttonVariants", () => {
	test("defaults to the primary md variant", () => {
		const cls = buttonVariants();
		expect(cls).toContain("bg-primary");
		expect(cls).toContain("h-11");
	});

	test("gives every variant a distinct root treatment", () => {
		const seen = new Set(BUTTON_VARIANTS.map((variant) => buttonVariants({ variant })));
		expect(seen.size).toBe(BUTTON_VARIANTS.length);
	});

	test("maps each variant to its surface", () => {
		expect(buttonVariants({ variant: "primary" })).toContain("bg-primary");
		expect(buttonVariants({ variant: "secondary" })).toContain("bg-secondary");
		expect(buttonVariants({ variant: "tertiary" })).toContain("bg-tertiary");
		expect(buttonVariants({ variant: "danger" })).toContain("bg-danger");
		expect(buttonVariants({ variant: "danger-soft" })).toContain("bg-danger-soft");
	});

	test("outline draws a border, ghost does not", () => {
		expect(buttonVariants({ variant: "outline" })).toContain("border-border");
		expect(buttonVariants({ variant: "outline" })).toContain("bg-transparent");
		expect(buttonVariants({ variant: "ghost" })).toContain("bg-transparent");
		expect(buttonVariants({ variant: "ghost" })).toContain("border-transparent");
	});

	test("gives every size a distinct height", () => {
		const seen = new Set(BUTTON_SIZES.map((size) => buttonVariants({ size })));
		expect(seen.size).toBe(BUTTON_SIZES.length);
		expect(buttonVariants({ size: "sm" })).toContain("h-9");
		expect(buttonVariants({ size: "md" })).toContain("h-11");
		expect(buttonVariants({ size: "lg" })).toContain("h-13");
	});

	test("icon-only swaps horizontal padding for a square width", () => {
		for (const size of BUTTON_SIZES) {
			const iconOnly = buttonVariants({ isIconOnly: true, size });
			expect(iconOnly).toMatch(/\bw-(9|11|13)\b/);
			expect(iconOnly).not.toMatch(/\bpx-\d/);
		}
		expect(buttonVariants({ isIconOnly: false, size: "md" })).toMatch(/\bpx-\d/);
	});

	test("adds the disabled treatment only when disabled", () => {
		expect(buttonVariants({ isDisabled: true })).toContain("opacity-50");
		expect(buttonVariants({ isDisabled: false })).not.toContain("opacity-50");
	});

	test("loading does not dim on its own, and dims only when asked", () => {
		expect(buttonVariants({ isLoading: true })).not.toContain("opacity-50");
		expect(buttonVariants({ isDimmedWhileLoading: true })).not.toContain("opacity-50");
		expect(buttonVariants({ isDimmedWhileLoading: true, isLoading: true })).toContain("opacity-50");
	});

	test("disabled still dims regardless of loading state", () => {
		expect(buttonVariants({ isDisabled: true, isLoading: true })).toContain("opacity-50");
		expect(buttonVariants({ isDimmedWhileLoading: false, isDisabled: true, isLoading: true })).toContain("opacity-50");
	});

	test("neither loading flag touches the root's text colour rule", () => {
		expect(buttonVariants({ isDimmedWhileLoading: true, isLoading: true })).not.toMatch(/\btext-(?!center\b)/);
	});

	test("merges an incoming className last", () => {
		expect(buttonVariants({ className: "bg-info" })).toContain("bg-info");
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

	test("only replaces the content and squares the footprint", () => {
		expect(resolveButtonLayout({ isLoading: true, spinnerPlacement: "only" })).toEqual({
			isIconOnly: true,
			isSpinnerOnly: true,
			spinnerSide: null,
		});
	});

	test("only squares a button that was not icon-only to begin with", () => {
		const layout = resolveButtonLayout({ isIconOnly: false, isLoading: true, spinnerPlacement: "only" });
		expect(layout.isIconOnly).toBe(true);
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
	test("a loading-only button gets the square width and no horizontal padding", () => {
		for (const size of BUTTON_SIZES) {
			const layout = resolveButtonLayout({ isLoading: true, spinnerPlacement: "only" });
			const cls = buttonVariants({ isIconOnly: layout.isIconOnly, isLoading: true, size });
			expect(cls).toMatch(/\bw-(9|11|13)\b/);
			expect(cls).not.toMatch(/\bpx-\d/);
		}
	});

	test("a start-placed spinner keeps the button's normal padding", () => {
		const layout = resolveButtonLayout({ isLoading: true, spinnerPlacement: "start" });
		const cls = buttonVariants({ isIconOnly: layout.isIconOnly, isLoading: true, size: "md" });
		expect(cls).toMatch(/\bpx-4\b/);
		expect(cls).not.toMatch(/\bw-\d/);
	});
});

describe("buttonLabelVariants", () => {
	test("carries the text colour, which the root must not", () => {
		for (const variant of BUTTON_VARIANTS) {
			expect(buttonLabelVariants({ variant })).toMatch(/\btext-/);
			expect(buttonVariants({ variant })).not.toMatch(/\btext-(?!center\b)/);
		}
	});

	test("pairs each surface with its own foreground", () => {
		expect(buttonLabelVariants({ variant: "primary" })).toContain("text-primary-foreground");
		expect(buttonLabelVariants({ variant: "secondary" })).toContain("text-secondary-foreground");
		expect(buttonLabelVariants({ variant: "tertiary" })).toContain("text-tertiary-foreground");
		expect(buttonLabelVariants({ variant: "danger" })).toContain("text-danger-foreground");
		expect(buttonLabelVariants({ variant: "danger-soft" })).toContain("text-danger-soft-foreground");
		expect(buttonLabelVariants({ variant: "outline" })).toContain("text-foreground");
		expect(buttonLabelVariants({ variant: "ghost" })).toContain("text-foreground");
	});

	test("scales label text with size", () => {
		expect(buttonLabelVariants({ size: "sm" })).toContain("text-sm");
		expect(buttonLabelVariants({ size: "md" })).toContain("text-base");
		expect(buttonLabelVariants({ size: "lg" })).toContain("text-lg");
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

describe("BUTTON_ICON_SIZE", () => {
	test("defines one icon size per button size, increasing with it", () => {
		const sizes = BUTTON_SIZES.map((size) => BUTTON_ICON_SIZE[size]);
		expect(sizes).toHaveLength(BUTTON_SIZES.length);
		expect(sizes.every((n) => typeof n === "number" && n > 0)).toBe(true);
		expect([...sizes]).toEqual([...sizes].sort((a, b) => a - b));
	});
});
