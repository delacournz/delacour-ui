import { describe, expect, test } from "bun:test";
import { INPUT_SIZES, INPUT_VARIANTS, inputVariants } from "../input/input.variants";
import {
	OTP_CARET_BLINK,
	OTP_DEFAULT_SIZE,
	OTP_DEFAULT_VARIANT,
	otpInputVariants,
	resolveOtpSlotClasses,
} from "./otp-input.variants";

const BOOLEANS = [false, true] as const;

/** Every border colour a cell can draw. */
const BORDER_COLOURS = new Set(["border-input", "border-transparent", "border-ring", "border-destructive"]);

/** Every class string `otpInputVariants` can emit, across the whole matrix. */
function everyClass(): string[] {
	const out: string[] = [];
	for (const variant of INPUT_VARIANTS) {
		for (const size of INPUT_SIZES) {
			for (const isActive of BOOLEANS) {
				for (const isInvalid of BOOLEANS) {
					for (const isDisabled of BOOLEANS) {
						for (const isFilled of BOOLEANS) {
							const slots = otpInputVariants({ isActive, isDisabled, isFilled, isInvalid, size, variant });
							out.push(
								slots.root(),
								slots.row(),
								slots.field(),
								slots.group(),
								slots.slot(),
								slots.char(),
								slots.placeholder(),
								slots.separator(),
								slots.caret()
							);
						}
					}
				}
			}
		}
	}
	return out;
}

function tokens(value: string): string[] {
	return value.split(/\s+/).filter(Boolean);
}

describe("otpInputVariants", () => {
	test("defaults mirror Input's", () => {
		expect(OTP_DEFAULT_SIZE).toBe("md");
		expect(OTP_DEFAULT_VARIANT).toBe("primary");
	});

	test("every size × variant × state emits a bordered, centred cell", () => {
		for (const variant of INPUT_VARIANTS) {
			for (const size of INPUT_SIZES) {
				for (const isActive of BOOLEANS) {
					for (const isInvalid of BOOLEANS) {
						const slot = tokens(resolveOtpSlotClasses({ isActive, isInvalid, size, variant }).slot);
						expect(slot).toContain("border");
						expect(slot).toContain("items-center");
						expect(slot).toContain("justify-center");
						expect(slot).toContain(`h-input-${size}`);
						expect(slot).toContain(`w-input-${size}`);
					}
				}
			}
		}
	});

	test("a cell wears the same fill and border tokens as a lone Input of that variant", () => {
		for (const variant of INPUT_VARIANTS) {
			const field = tokens(inputVariants({ variant }).root());
			const slot = tokens(resolveOtpSlotClasses({ variant }).slot);
			for (const utility of field.filter((c) => c.startsWith("bg-") || c.startsWith("border-"))) {
				expect(slot).toContain(utility);
			}
		}
	});

	test("the character takes Input's type scale at each size", () => {
		for (const size of INPUT_SIZES) {
			expect(tokens(resolveOtpSlotClasses({ size }).char)).toContain(`text-input-${size}`);
			expect(tokens(resolveOtpSlotClasses({ size }).placeholder)).toContain(`text-input-${size}`);
		}
	});

	test("the corner follows Input's ramp — md at sm, lg above", () => {
		expect(tokens(resolveOtpSlotClasses({ size: "sm" }).slot)).toContain("rounded-md");
		expect(tokens(resolveOtpSlotClasses({ size: "md" }).slot)).toContain("rounded-lg");
		expect(tokens(resolveOtpSlotClasses({ size: "lg" }).slot)).toContain("rounded-lg");
	});

	test("the active cell takes the ring", () => {
		expect(tokens(resolveOtpSlotClasses({ isActive: true }).slot)).toContain("border-ring");
		expect(tokens(resolveOtpSlotClasses({ isActive: false }).slot)).not.toContain("border-ring");
	});

	test("invalid paints every cell destructive", () => {
		for (const isActive of BOOLEANS) {
			expect(tokens(resolveOtpSlotClasses({ isActive, isInvalid: true }).slot)).toContain("border-destructive");
		}
	});

	test("invalid outranks focus — an active invalid cell never wears the ring", () => {
		for (const variant of INPUT_VARIANTS) {
			for (const size of INPUT_SIZES) {
				const slot = tokens(resolveOtpSlotClasses({ isActive: true, isInvalid: true, size, variant }).slot);
				expect(slot).not.toContain("border-ring");
				expect(slot).toContain("border-destructive");
			}
		}
	});

	test("a cell keeps exactly one border colour in every state", () => {
		for (const variant of INPUT_VARIANTS) {
			for (const isActive of BOOLEANS) {
				for (const isInvalid of BOOLEANS) {
					const slot = tokens(resolveOtpSlotClasses({ isActive, isInvalid, variant }).slot);
					const colours = slot.filter((c) => BORDER_COLOURS.has(c));
					expect(colours).toHaveLength(1);
				}
			}
		}
	});

	test("the caret takes the selection token, destructive while invalid", () => {
		expect(tokens(resolveOtpSlotClasses({}).caret)).toContain("bg-primary");
		expect(tokens(resolveOtpSlotClasses({ isInvalid: true }).caret)).toContain("bg-destructive");
		expect(tokens(resolveOtpSlotClasses({ isInvalid: true }).caret)).not.toContain("bg-primary");
	});

	test("the caret height steps with the size", () => {
		const heights = INPUT_SIZES.map((size) =>
			tokens(resolveOtpSlotClasses({ size }).caret).find((c) => c.startsWith("h-"))
		);
		expect(new Set(heights).size).toBe(INPUT_SIZES.length);
	});

	test("disabled fades the row, not each cell", () => {
		expect(tokens(otpInputVariants({ isDisabled: true }).root())).toContain("opacity-50");
		expect(tokens(otpInputVariants({ isDisabled: false }).root())).not.toContain("opacity-50");
		expect(tokens(resolveOtpSlotClasses({}).slot)).not.toContain("opacity-50");
	});

	test("the placeholder is dimmed and the character is not", () => {
		expect(tokens(resolveOtpSlotClasses({}).placeholder)).toContain("text-muted-foreground");
		expect(tokens(resolveOtpSlotClasses({}).char)).toContain("text-foreground");
	});

	test("the separator is a short bar, the same at every size", () => {
		const bars = INPUT_SIZES.map((size) => otpInputVariants({ size }).separator());
		expect(new Set(bars).size).toBe(1);
		const separator = tokens(bars[0] ?? "");
		expect(separator).toContain("bg-border");
		expect(separator.some((c) => c.startsWith("text-"))).toBe(false);
	});

	test("the hidden field fills the row", () => {
		const field = tokens(otpInputVariants().field());
		expect(field).toContain("absolute");
		expect(field).toContain("inset-0");
	});

	test("the row and groups gap like an Input.Group's row at each size", () => {
		for (const size of INPUT_SIZES) {
			const gap = tokens(inputVariants({ size }).row()).find((c) => c.startsWith("gap-"));
			expect(gap).toBeDefined();
			expect(tokens(otpInputVariants({ size }).row())).toContain(gap ?? "");
			expect(tokens(otpInputVariants({ size }).group())).toContain(gap ?? "");
		}
	});

	test("a caller's class wins over the slot's", () => {
		expect(tokens(resolveOtpSlotClasses({ className: "rounded-full" }).slot)).toContain("rounded-full");
		expect(tokens(resolveOtpSlotClasses({ className: "rounded-full" }).slot)).not.toContain("rounded-lg");
	});

	test("no raw palette colours and no dark: prefix anywhere", () => {
		for (const value of everyClass()) {
			for (const utility of tokens(value)) {
				expect(utility.startsWith("dark:")).toBe(false);
				expect(/-(?:white|black)$/.test(utility)).toBe(false);
				expect(/^(?:bg|text|border|accent)-[a-z]+-\d{2,3}$/.test(utility)).toBe(false);
			}
		}
	});
});

describe("OTP_CARET_BLINK", () => {
	test("holds visible long enough to read and fades fast", () => {
		expect(OTP_CARET_BLINK.holdMs).toBeGreaterThanOrEqual(300);
		expect(OTP_CARET_BLINK.fadeMs).toBeLessThan(OTP_CARET_BLINK.holdMs);
		expect(OTP_CARET_BLINK.fadeMs).toBeGreaterThan(0);
	});
});
