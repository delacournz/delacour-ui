import { describe, expect, test } from "bun:test";
import {
	BUTTON_ICON_SIZE,
	BUTTON_SIZES,
	BUTTON_VARIANTS,
	buttonLabelVariants,
	buttonVariants,
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

	test("merges an incoming className last", () => {
		expect(buttonVariants({ className: "bg-info" })).toContain("bg-info");
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

describe("BUTTON_ICON_SIZE", () => {
	test("defines one icon size per button size, increasing with it", () => {
		const sizes = BUTTON_SIZES.map((size) => BUTTON_ICON_SIZE[size]);
		expect(sizes).toHaveLength(BUTTON_SIZES.length);
		expect(sizes.every((n) => typeof n === "number" && n > 0)).toBe(true);
		expect([...sizes]).toEqual([...sizes].sort((a, b) => a - b));
	});
});
