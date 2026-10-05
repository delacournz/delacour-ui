import { describe, expect, test } from "bun:test";
import { declaredTokens, TOKENS_CSS } from "../../styles/theme-tokens.test";
import { CHIP_SIZES, chipVariants } from "../chip/chip.variants";
import {
	INPUT_SIZES,
	INPUT_VARIANTS,
	type InputBoxState,
	inputVariants,
	resolveInputGroupClass,
} from "../input/input.variants";
import {
	resolveTagInputBoxClass,
	resolveTagInputChip,
	resolveTagInputClearIconClass,
	resolveTagInputCounterColor,
	resolveTagInputFieldClass,
	TAG_INPUT_BORDER_WIDTH,
	TAG_INPUT_CHIP_SIZE,
	TAG_INPUT_PADDING_Y,
	tagInputVariants,
} from "./tag-input.variants";

/** Tailwind's default line height for each label step a chip uses, in points. */
const LINE_HEIGHT_PX: Record<string, number> = { "text-base": 24, "text-sm": 20, "text-xs": 16 };

/** One Tailwind spacing step, in points. */
const SPACING_PX = 4;

function spacing(cls: string, utility: string): number | undefined {
	const step = cls.match(new RegExp(`(?:^|\\s)${utility}-([\\d.]+)(?:\\s|$)`))?.[1];
	return step === undefined ? undefined : Number(step) * SPACING_PX;
}

/** A chip's rendered height at one OS font scale: its padding, one line of its label, and its border. */
function chipHeight(size: (typeof CHIP_SIZES)[number]): number {
	const slots = chipVariants({ size });
	const label = slots.label().match(/\btext-(xs|sm|base)\b/)?.[0] ?? "";
	return (spacing(slots.root(), "py") ?? 0) * 2 + (LINE_HEIGHT_PX[label] ?? 0) + TAG_INPUT_BORDER_WIDTH * 2;
}

function inputHeight(size: (typeof INPUT_SIZES)[number]): number {
	return Number(TOKENS_CSS.match(new RegExp(`--spacing-input-${size}:\\s*(\\d+)px`))?.[1]);
}

function everyBoxState(): InputBoxState[] {
	const states: InputBoxState[] = [];
	for (const variant of INPUT_VARIANTS) {
		for (const size of INPUT_SIZES) {
			for (const isInvalid of [false, true]) {
				for (const isFocused of [false, true]) {
					for (const isDisabled of [false, true]) {
						states.push({ isDisabled, isFocused, isInvalid, size, variant });
					}
				}
			}
		}
	}
	return states;
}

function classes(cls: string): string[] {
	return cls.split(/\s+/).filter(Boolean);
}

describe("the box", () => {
	test("wears every chrome utility a multiline Input.Group does, at every variant × size × state", () => {
		for (const state of everyBoxState()) {
			const box = classes(resolveTagInputBoxClass(state));
			const group = classes(resolveInputGroupClass({ ...state, isMultiline: true }));
			for (const cls of group.filter((c) => !/^py-/.test(c))) {
				expect({ state, cls, present: box.includes(cls) }).toEqual({ state, cls, present: true });
			}
		}
	});

	test("differs from it only in its vertical padding", () => {
		for (const state of everyBoxState()) {
			const box = new Set(classes(resolveTagInputBoxClass(state)));
			const group = new Set(classes(resolveInputGroupClass({ ...state, isMultiline: true })));
			const extra = [...box].filter((c) => !group.has(c));
			expect(extra.every((c) => /^py-/.test(c))).toBe(true);
		}
	});

	test("is floored at the input height, never fixed", () => {
		for (const size of INPUT_SIZES) {
			const box = resolveTagInputBoxClass({ size });
			expect(box).toContain(`min-h-input-${size}`);
			expect(box).not.toMatch(/(?:^|\s)h-input-/);
		}
	});

	test("one row of chips fills the floor exactly, so the first chip does not grow the box", () => {
		for (const size of INPUT_SIZES) {
			const padding = spacing(resolveTagInputBoxClass({ size }), "py");
			expect(padding).toBe(TAG_INPUT_PADDING_Y[size]);
			expect(TAG_INPUT_PADDING_Y[size] * 2 + TAG_INPUT_BORDER_WIDTH * 2 + chipHeight(TAG_INPUT_CHIP_SIZE[size])).toBe(
				inputHeight(size)
			);
		}
	});

	test("a caller's className wins", () => {
		expect(resolveTagInputBoxClass({ className: "py-4" })).toContain("py-4");
		expect(resolveTagInputBoxClass({ className: "py-4" })).not.toMatch(/(?:^|\s)py-2(?:\s|$)/);
	});
});

describe("the tags row", () => {
	test("wraps", () => {
		expect(tagInputVariants().tags()).toContain("flex-wrap");
		expect(tagInputVariants().tags()).toContain("flex-row");
	});

	test("never has a height of its own", () => {
		for (const size of INPUT_SIZES) {
			expect(tagInputVariants({ size }).tags()).not.toMatch(/(?:^|\s)(?:min-)?h-/);
		}
	});
});

describe("the field", () => {
	test("keeps Input's text treatment at every size", () => {
		for (const size of INPUT_SIZES) {
			const field = classes(resolveTagInputFieldClass({ size }));
			for (const cls of classes(inputVariants({ isGrouped: true, size }).field())) {
				expect(field).toContain(cls);
			}
		}
	});

	test("keeps a minimum width, so it drops to its own line rather than being squeezed", () => {
		expect(resolveTagInputFieldClass({})).toContain("min-w-24");
	});

	test("is as tall as a chip, so a line holding only text is as tall as a line of chips", () => {
		for (const size of INPUT_SIZES) {
			expect(spacing(resolveTagInputFieldClass({ size }), "h")).toBe(chipHeight(TAG_INPUT_CHIP_SIZE[size]));
		}
	});
});

describe("the chips", () => {
	test("step down so a chip never makes a row taller than the field", () => {
		expect(TAG_INPUT_CHIP_SIZE).toEqual({ lg: "md", md: "sm", sm: "sm" });
		for (const size of INPUT_SIZES) expect(CHIP_SIZES).toContain(TAG_INPUT_CHIP_SIZE[size]);
	});

	test("rest in the caller's variant and default colour", () => {
		expect(
			resolveTagInputChip({ boxVariant: "primary", isPendingRemove: false, size: "md", variant: "outline" })
		).toEqual({
			color: "default",
			size: "sm",
			variant: "outline",
		});
	});

	// A soft default chip is `bg-muted`, and a secondary box is `bg-secondary` —
	// the same step in both themes, so the pill vanished into the box.
	test("a soft chip on a secondary box lifts to the elevated surface", () => {
		expect(
			resolveTagInputChip({ boxVariant: "secondary", isPendingRemove: false, size: "md", variant: "soft" })
		).toEqual({
			className: "bg-elevated",
			color: "default",
			size: "sm",
			variant: "soft",
		});
		expect(
			resolveTagInputChip({ boxVariant: "secondary", isPendingRemove: false, size: "md", variant: "outline" }).className
		).toBeUndefined();
		expect(
			resolveTagInputChip({ boxVariant: "secondary", isPendingRemove: true, size: "md", variant: "soft" }).className
		).toBeUndefined();
		expect(
			resolveTagInputChip({ boxVariant: "primary", isPendingRemove: false, size: "md", variant: "soft" }).className
		).toBeUndefined();
	});

	test("an armed chip turns soft destructive", () => {
		expect(
			resolveTagInputChip({ boxVariant: "primary", isPendingRemove: true, size: "lg", variant: "outline" })
		).toEqual({
			color: "destructive",
			size: "md",
			variant: "soft",
		});
	});
});

describe("the suffix", () => {
	test("sits at the end of the last row, a chip's height tall", () => {
		for (const size of INPUT_SIZES) {
			const suffix = tagInputVariants({ size }).suffix();
			expect(suffix).toContain("self-end");
			expect(spacing(suffix, "h")).toBe(chipHeight(TAG_INPUT_CHIP_SIZE[size]));
		}
	});

	test("the clear glyph takes Input's decorator icon step", () => {
		for (const size of INPUT_SIZES) {
			expect(resolveTagInputClearIconClass(size)).toBe(inputVariants({ size }).decoratorIcon());
		}
	});

	test("the counter turns destructive past the limit", () => {
		expect(resolveTagInputCounterColor(false)).toBe("muted");
		expect(resolveTagInputCounterColor(true)).toBe("destructive");
	});
});

describe("tokens", () => {
	const every = INPUT_SIZES.flatMap((size) => {
		const slots = tagInputVariants({ size });
		return [slots.tags(), slots.suffix(), slots.clear(), slots.counter(), resolveTagInputFieldClass({ size })];
	}).join(" ");

	test("no dark: prefix anywhere", () => {
		expect(every).not.toContain("dark:");
	});

	test("every colour named is declared in both themes", () => {
		const light = declaredTokens("light");
		const dark = declaredTokens("dark");
		const colours = [...every.matchAll(/\b(?:text|bg|border|accent)-([a-z]+(?:-[a-z]+)*)\b/g)]
			.map((match) => match[1] ?? "")
			.filter((name) => light.has(name) || dark.has(name) || /foreground|destructive|primary|muted/.test(name));
		for (const name of colours) {
			expect({ name, light: light.has(name), dark: dark.has(name) }).toEqual({ dark: true, light: true, name });
		}
	});
});
