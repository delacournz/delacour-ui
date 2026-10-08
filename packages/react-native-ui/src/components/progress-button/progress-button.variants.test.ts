import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { buttonVariants } from "../button/button.variants";
import {
	PROGRESS_BUTTON_DEFAULT_AUTO_RESET_MS,
	PROGRESS_BUTTON_DEFAULT_HINT,
	PROGRESS_BUTTON_DEFAULT_HOLD_MS,
	PROGRESS_BUTTON_FILL_FOREGROUND_TOKEN,
	PROGRESS_BUTTON_FILL_TOKEN,
	PROGRESS_BUTTON_LABEL_TOKEN,
	PROGRESS_BUTTON_MIN_HOLD_MS,
	PROGRESS_BUTTON_REDUCED_MOTION_STEPS,
	PROGRESS_BUTTON_SHAPES,
	PROGRESS_BUTTON_SIZES,
	PROGRESS_BUTTON_VARIANTS,
	progressButtonVariants,
	resolveAutoResetDelay,
	resolveHoldDuration,
	resolveProgressButtonAccessibilityState,
	resolveRemainingDuration,
	resolveSteppedProgress,
} from "./progress-button.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** Every theme token a class string paints with, with any `/alpha` suffix dropped. */
function colorTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const [, utility, token] of cls.matchAll(/\b(bg|text)-([a-z][\w-]*)(?:\/\d+)?\b/g)) {
		if (utility === "text" && token.startsWith("button-")) continue;
		if (utility === "text" && (token === "center" || token === "left" || token === "right")) continue;
		tokens.push(token);
	}
	return tokens;
}

const SLOT_NAMES = ["root", "content", "fill", "fillContent", "label", "fillLabel", "done", "icon"] as const;

describe("resolveHoldDuration", () => {
	test("defaults to two seconds", () => {
		expect(PROGRESS_BUTTON_DEFAULT_HOLD_MS).toBe(2000);
		expect(resolveHoldDuration()).toBe(2000);
		expect(resolveHoldDuration(undefined)).toBe(2000);
	});

	test("passes a sensible value through", () => {
		expect(resolveHoldDuration(1500)).toBe(1500);
		expect(resolveHoldDuration(200)).toBe(200);
	});

	test("floors a hold too short to be deliberate", () => {
		expect(PROGRESS_BUTTON_MIN_HOLD_MS).toBe(200);
		expect(resolveHoldDuration(50)).toBe(200);
		expect(resolveHoldDuration(0)).toBe(200);
		expect(resolveHoldDuration(-1000)).toBe(200);
	});

	test("a non-finite value gives the default", () => {
		expect(resolveHoldDuration(Number.NaN)).toBe(2000);
		expect(resolveHoldDuration(Number.POSITIVE_INFINITY)).toBe(2000);
		expect(resolveHoldDuration(Number.NEGATIVE_INFINITY)).toBe(2000);
	});
});

describe("resolveRemainingDuration", () => {
	test("forward from empty is the whole hold", () => {
		expect(resolveRemainingDuration({ direction: "forward", holdDuration: 2000, progress: 0 })).toBe(2000);
	});

	test("forward resumes from where the fill is", () => {
		expect(resolveRemainingDuration({ direction: "forward", holdDuration: 2000, progress: 0.25 })).toBe(1500);
		expect(resolveRemainingDuration({ direction: "forward", holdDuration: 2000, progress: 1 })).toBe(0);
	});

	test("reverse plays back at the same rate", () => {
		expect(resolveRemainingDuration({ direction: "reverse", holdDuration: 2000, progress: 0.9 })).toBeCloseTo(1800);
		expect(resolveRemainingDuration({ direction: "reverse", holdDuration: 2000, progress: 0 })).toBe(0);
	});

	test("forward and reverse at one point sum to the hold", () => {
		for (const progress of [0, 0.1, 0.5, 0.73, 1]) {
			const forward = resolveRemainingDuration({ direction: "forward", holdDuration: 1200, progress });
			const reverse = resolveRemainingDuration({ direction: "reverse", holdDuration: 1200, progress });
			expect(forward + reverse).toBeCloseTo(1200);
		}
	});

	test("clamps progress outside 0..1 and treats a non-finite one as empty", () => {
		expect(resolveRemainingDuration({ direction: "forward", holdDuration: 2000, progress: -0.5 })).toBe(2000);
		expect(resolveRemainingDuration({ direction: "forward", holdDuration: 2000, progress: 1.5 })).toBe(0);
		expect(resolveRemainingDuration({ direction: "reverse", holdDuration: 2000, progress: Number.NaN })).toBe(0);
	});
});

describe("resolveSteppedProgress", () => {
	test("steps in fifths by default", () => {
		expect(PROGRESS_BUTTON_REDUCED_MOTION_STEPS).toBe(5);
		expect(resolveSteppedProgress(0)).toBe(0);
		expect(resolveSteppedProgress(0.19)).toBe(0);
		expect(resolveSteppedProgress(0.2)).toBe(0.2);
		expect(resolveSteppedProgress(0.39)).toBe(0.2);
		expect(resolveSteppedProgress(0.5)).toBe(0.4);
		expect(resolveSteppedProgress(0.99)).toBe(0.8);
		expect(resolveSteppedProgress(1)).toBe(1);
	});

	test("takes another step count", () => {
		expect(resolveSteppedProgress(0.6, 2)).toBe(0.5);
		expect(resolveSteppedProgress(0.3, 4)).toBe(0.25);
	});

	test("clamps, and never shows more than the hold has earned", () => {
		expect(resolveSteppedProgress(-1)).toBe(0);
		expect(resolveSteppedProgress(2)).toBe(1);
		expect(resolveSteppedProgress(Number.NaN)).toBe(0);
		for (let p = 0; p <= 1; p += 0.01) {
			expect(resolveSteppedProgress(p)).toBeLessThanOrEqual(p + 1e-9);
		}
	});

	test("a step count below one is treated as one", () => {
		expect(resolveSteppedProgress(0.5, 0)).toBe(0);
		expect(resolveSteppedProgress(1, 0)).toBe(1);
	});
});

describe("resolveAutoResetDelay", () => {
	test("defaults to a second", () => {
		expect(PROGRESS_BUTTON_DEFAULT_AUTO_RESET_MS).toBe(1000);
		expect(resolveAutoResetDelay()).toBe(1000);
	});

	test("passes a value through and floors a negative one at zero", () => {
		expect(resolveAutoResetDelay(2500)).toBe(2500);
		expect(resolveAutoResetDelay(0)).toBe(0);
		expect(resolveAutoResetDelay(-5)).toBe(0);
	});

	test("a non-finite value gives the default", () => {
		expect(resolveAutoResetDelay(Number.NaN)).toBe(1000);
		expect(resolveAutoResetDelay(Number.POSITIVE_INFINITY)).toBe(1000);
	});
});

describe("resolveProgressButtonAccessibilityState", () => {
	test("announces disabled and completed as checked", () => {
		expect(resolveProgressButtonAccessibilityState({ isCompleted: false, isDisabled: false })).toEqual({
			checked: false,
			disabled: false,
		});
		expect(resolveProgressButtonAccessibilityState({ isCompleted: true, isDisabled: true })).toEqual({
			checked: true,
			disabled: true,
		});
	});

	test("the default hint says the button has to be held", () => {
		expect(PROGRESS_BUTTON_DEFAULT_HINT.toLowerCase()).toContain("hold");
	});
});

describe("progressButtonVariants — axes", () => {
	test("exposes the variants, sizes and shapes the API names", () => {
		expect([...PROGRESS_BUTTON_VARIANTS]).toEqual(["primary", "secondary", "destructive", "success"]);
		expect([...PROGRESS_BUTTON_SIZES]).toEqual(["sm", "md", "lg"]);
		expect([...PROGRESS_BUTTON_SHAPES]).toEqual(["pill", "rounded"]);
	});

	test("defaults to primary, md, pill", () => {
		const root = progressButtonVariants().root();
		expect(root).toContain("h-button-md");
		expect(root).toContain("rounded-button-md");
		expect(progressButtonVariants().fill()).toContain("bg-primary");
	});

	test("every variant rests on the same surface", () => {
		for (const variant of PROGRESS_BUTTON_VARIANTS) {
			const root = progressButtonVariants({ variant }).root();
			expect(root).toContain("bg-secondary");
			expect(colorTokens(root)).toEqual(["secondary"]);
		}
	});

	test("the variant colour is carried by the fill and the labels", () => {
		for (const variant of PROGRESS_BUTTON_VARIANTS) {
			const slots = progressButtonVariants({ variant });
			expect(slots.fill()).toContain(`bg-${PROGRESS_BUTTON_FILL_TOKEN[variant]}`);
			expect(slots.label()).toContain(`text-${PROGRESS_BUTTON_LABEL_TOKEN[variant]}`);
			expect(slots.fillLabel()).toContain(`text-${PROGRESS_BUTTON_FILL_FOREGROUND_TOKEN[variant]}`);
		}
	});

	test("secondary fills with the foreground and draws its inner label on the background", () => {
		const slots = progressButtonVariants({ variant: "secondary" });
		expect(slots.fill()).toContain("bg-foreground");
		expect(slots.label()).toContain("text-secondary-foreground");
		expect(slots.fillLabel()).toContain("text-background");
	});

	test("the two label copies differ only in colour", () => {
		for (const variant of PROGRESS_BUTTON_VARIANTS) {
			for (const size of PROGRESS_BUTTON_SIZES) {
				const slots = progressButtonVariants({ size, variant });
				const strip = (cls: string) =>
					cls
						.split(/\s+/)
						.filter((c) => colorTokens(c).length === 0)
						.sort();
				expect(strip(slots.label())).toEqual(strip(slots.fillLabel()));
			}
		}
	});

	test("the fill is clipped and anchored to the leading edge", () => {
		const fill = progressButtonVariants().fill();
		for (const cls of ["absolute", "overflow-hidden", "inset-y-0", "start-0"]) {
			expect(fill).toContain(cls);
		}
	});
});

describe("progressButtonVariants — the button's box", () => {
	test("height, padding, label step and icon step come off the button's own size tokens", () => {
		for (const size of PROGRESS_BUTTON_SIZES) {
			const ours = progressButtonVariants({ size });
			const button = buttonVariants({ size });
			const buttonRoot = button.root().split(/\s+/);
			const height = buttonRoot.find((c) => c.startsWith("h-button-"));
			const padding = buttonRoot.find((c) => c.startsWith("px-"));
			expect(height).toBeDefined();
			expect(padding).toBeDefined();
			expect(ours.root()).toContain(height as string);
			expect(ours.root()).toContain(padding as string);
			expect(ours.fillContent()).toContain(padding as string);
			expect(ours.label()).toContain(`text-button-${size}`);
			expect(ours.icon()).toContain(`size-icon-${size}`);
		}
	});

	test("a pill takes the button's corner, rounded takes the card's", () => {
		for (const size of PROGRESS_BUTTON_SIZES) {
			expect(progressButtonVariants({ shape: "pill", size }).root()).toContain(`rounded-button-${size}`);
			const rounded = progressButtonVariants({ shape: "rounded", size }).root();
			expect(rounded).toContain("rounded-lg");
			expect(rounded).not.toContain("rounded-button-");
		}
	});

	test("full width stretches", () => {
		const root = progressButtonVariants({ isFullWidth: true }).root();
		expect(root).toContain("w-full");
		expect(root).toContain("self-stretch");
		expect(progressButtonVariants({ isFullWidth: false }).root()).not.toContain("w-full");
	});

	test("disabled fades", () => {
		expect(progressButtonVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(progressButtonVariants({ isDisabled: false }).root()).not.toContain("opacity-50");
	});

	test("a caller's className merges over the root's own", () => {
		const root = progressButtonVariants().root({ className: "rounded-none" });
		expect(root).toContain("rounded-none");
		expect(root).not.toContain("rounded-button-md");
	});
});

describe("progressButtonVariants — theme tokens", () => {
	test("the theme reader found both variants", () => {
		expect(LIGHT.size).toBeGreaterThan(0);
		expect(DARK.size).toBeGreaterThan(0);
	});

	test("every token named in every slot, at every axis, exists in both themes", () => {
		for (const variant of PROGRESS_BUTTON_VARIANTS) {
			for (const size of PROGRESS_BUTTON_SIZES) {
				for (const shape of PROGRESS_BUTTON_SHAPES) {
					const slots = progressButtonVariants({ shape, size, variant });
					for (const name of SLOT_NAMES) {
						for (const token of colorTokens(slots[name]() ?? "")) {
							expect({ theme: "light", token, has: LIGHT.has(token) }).toEqual({
								has: true,
								theme: "light",
								token,
							});
							expect({ theme: "dark", token, has: DARK.has(token) }).toEqual({
								has: true,
								theme: "dark",
								token,
							});
						}
					}
				}
			}
		}
	});

	test("every token in the colour tables exists in both themes", () => {
		for (const table of [
			PROGRESS_BUTTON_FILL_TOKEN,
			PROGRESS_BUTTON_LABEL_TOKEN,
			PROGRESS_BUTTON_FILL_FOREGROUND_TOKEN,
		]) {
			for (const variant of PROGRESS_BUTTON_VARIANTS) {
				expect(LIGHT.has(table[variant])).toBe(true);
				expect(DARK.has(table[variant])).toBe(true);
			}
		}
	});

	test("the fill and its label never share a token", () => {
		for (const variant of PROGRESS_BUTTON_VARIANTS) {
			expect(PROGRESS_BUTTON_FILL_TOKEN[variant]).not.toBe(PROGRESS_BUTTON_FILL_FOREGROUND_TOKEN[variant]);
		}
	});
});
