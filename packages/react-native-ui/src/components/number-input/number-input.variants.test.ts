import { describe, expect, test } from "bun:test";
import { INPUT_SIZES, resolveInputGroupClass } from "../input/input.variants";
import {
	NUMBER_INPUT_GROUP_CLASS,
	NUMBER_INPUT_STEPPER_DISABLED_ICON_TOKEN,
	NUMBER_INPUT_STEPPER_ICON_TOKEN,
	NUMBER_INPUT_STEPPER_POSITIONS,
	numberInputVariants,
	resolveNumberInputFieldClass,
	resolveStepperHitSlop,
	resolveStepperIconToken,
} from "./number-input.variants";

/** Raw Tailwind palette colours, which a component must never name. */
const RAW_PALETTE = /\b(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|blue|green|black|white)\b/;

describe("the stepper slot", () => {
	test("is as wide as the box is tall, at every size", () => {
		for (const size of INPUT_SIZES) {
			const cls = numberInputVariants({ size }).stepper();
			expect(cls).toContain(`w-input-${size}`);
			expect(cls).toContain("self-stretch");
		}
	});

	test("draws its separator on the field side", () => {
		expect(numberInputVariants({ position: "start" }).stepper()).toContain("border-e");
		expect(numberInputVariants({ position: "end" }).stepper()).toContain("border-s");
	});

	test("the target fills the square", () => {
		expect(numberInputVariants().stepperTarget()).toContain("flex-1");
		expect(numberInputVariants().stepperTarget()).toContain("self-stretch");
	});

	test("names no raw palette colour", () => {
		for (const size of INPUT_SIZES) {
			for (const position of NUMBER_INPUT_STEPPER_POSITIONS) {
				for (const isDisabled of [true, false]) {
					const slots = numberInputVariants({ isDisabled, position, size });
					expect(slots.stepper()).not.toMatch(RAW_PALETTE);
					expect(slots.stepperIcon()).not.toMatch(RAW_PALETTE);
					expect(slots.stepperTarget()).not.toMatch(RAW_PALETTE);
				}
			}
		}
	});

	test("the icon follows the box's icon step", () => {
		expect(numberInputVariants({ size: "sm" }).stepperIcon()).toContain("size-icon-sm");
		expect(numberInputVariants({ size: "md" }).stepperIcon()).toContain("size-icon-md");
		expect(numberInputVariants({ size: "lg" }).stepperIcon()).toContain("size-icon-lg");
	});
});

describe("a disabled stepper", () => {
	test("draws differently from an enabled one", () => {
		expect(resolveStepperIconToken({ isDisabled: true })).toBe(NUMBER_INPUT_STEPPER_DISABLED_ICON_TOKEN);
		expect(resolveStepperIconToken({ isDisabled: false })).toBe(NUMBER_INPUT_STEPPER_ICON_TOKEN);
		expect(NUMBER_INPUT_STEPPER_ICON_TOKEN).not.toBe(NUMBER_INPUT_STEPPER_DISABLED_ICON_TOKEN);
	});
});

describe("the group", () => {
	test("clears the box's gutter so the steppers sit flush to the border", () => {
		for (const size of INPUT_SIZES) {
			const cls = resolveInputGroupClass({ className: NUMBER_INPUT_GROUP_CLASS, size });
			expect(cls).toContain("px-0");
			expect(cls).toContain("gap-0");
			expect(cls).not.toMatch(/\bpx-(2\.5|3|3\.5)\b/);
			expect(cls).not.toMatch(/\bgap-(1\.5|2|2\.5)\b/);
			expect(cls).toContain(`h-input-${size}`);
		}
	});
});

describe("the field", () => {
	test("centres its value and keeps a little air off the separators", () => {
		const cls = resolveNumberInputFieldClass();
		expect(cls).toContain("text-center");
		expect(cls).toContain("px-1");
	});

	test("keeps a width of its own when the box is shrink-wrapped", () => {
		expect(resolveNumberInputFieldClass()).toContain("min-w-16");
	});

	test("a caller's class merges last", () => {
		expect(resolveNumberInputFieldClass("px-3")).toContain("px-3");
		expect(resolveNumberInputFieldClass("px-3")).not.toContain("px-1");
	});
});

describe("resolveStepperHitSlop", () => {
	test("only the small box extends its steppers' targets", () => {
		expect(resolveStepperHitSlop("sm")).toBeGreaterThan(0);
		expect(resolveStepperHitSlop("md")).toBe(0);
		expect(resolveStepperHitSlop("lg")).toBe(0);
	});
});
