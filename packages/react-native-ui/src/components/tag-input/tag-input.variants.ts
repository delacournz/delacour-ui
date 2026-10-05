import type { VariantProps } from "tailwind-variants";
import { cn } from "../../lib/cn";
import { tv } from "../../lib/tv";
import type { ChipColor, ChipSize, ChipVariant } from "../chip/chip.variants";
import { type InputBoxState, type InputSize, inputVariants, resolveInputGroupClass } from "../input/input.variants";

/**
 * The chip size each field size draws its tags at.
 *
 * A step down from the field's own size, so a row of chips fits inside the
 * field's floor rather than pushing it taller: the first tag added must not
 * make the box jump. `tag-input.variants.test.ts` adds the heights up.
 */
export const TAG_INPUT_CHIP_SIZE: Record<InputSize, ChipSize> = { sm: "sm", md: "sm", lg: "md" };

/**
 * Vertical padding inside the box, in points, by size — the `py-*` the box
 * slot carries, restated as a number so the test can prove that padding, a
 * chip and the border sum to `--spacing-input-*` exactly.
 */
export const TAG_INPUT_PADDING_Y: Record<InputSize, number> = { sm: 4, md: 8, lg: 8 };

/** The hairline both `Input`'s box and a chip draw, counted top and bottom. */
export const TAG_INPUT_BORDER_WIDTH = 1;

/**
 * Styling for the parts a tag input adds inside `Input`'s box.
 *
 * The box itself — border, fill, corner, focus, invalid, disabled — is not
 * here. It is `Input.Group`'s `root` slot at its multiline floor, read through
 * {@link resolveTagInputBoxClass}, so the chrome is the same box by
 * construction. What this adds is the tighter vertical padding a chip row
 * needs, the wrapping row of tags, the field's line height and the suffix.
 *
 * `field` and `suffix` are a chip's height at their size (26 and 34 points),
 * so a line holding only the text field is as tall as a line of chips and the
 * wrapped rows stay even. `tags` has no height at all: it grows by rows.
 *
 * `counter` carries no colour: it renders `Text.Caption`, whose `color` prop
 * is where that is decided — {@link resolveTagInputCounterColor}.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const tagInputVariants = tv({
	slots: {
		box: "",
		tags: "flex-1 flex-row flex-wrap content-center items-center self-stretch",
		field: "min-w-24",
		suffix: "flex-row items-center gap-1.5 self-end",
		clear: "items-center justify-center",
		counter: "tabular-nums",
	},
	variants: {
		size: {
			sm: { box: "py-1", tags: "gap-1.5", field: "h-6.5", suffix: "h-6.5" },
			md: { box: "py-2", tags: "gap-1.5", field: "h-6.5", suffix: "h-6.5" },
			lg: { box: "py-2", tags: "gap-2", field: "h-8.5", suffix: "h-8.5" },
		},
	},
	defaultVariants: { size: "md" },
});

/**
 * The class the box wears: `Input.Group`'s row at its multiline floor — the
 * height a minimum and the content top-aligned, the rule `Input` applies to a
 * field that grows — with the vertical padding tightened to fit a chip row.
 *
 * Pure, so the parity with `Input` is reachable from `bun test`.
 */
export function resolveTagInputBoxClass({
	className,
	size = "md",
	...state
}: InputBoxState & { className?: string }): string {
	return cn(resolveInputGroupClass({ ...state, isMultiline: true, size }), tagInputVariants({ size }).box(), className);
}

/**
 * The class the text field wears: `Input`'s grouped field treatment — type
 * scale, colour, face, no padding — plus a chip's height and a minimum width,
 * so it drops to a line of its own rather than being squeezed beside a long
 * tag.
 */
export function resolveTagInputFieldClass({
	className,
	size = "md",
}: {
	className?: string;
	size?: InputSize;
}): string {
	return cn(inputVariants({ isGrouped: true, size }).field(), tagInputVariants({ size }).field(), className);
}

/** The clear glyph's edge, which is `Input`'s decorator icon at the same size. */
export function resolveTagInputClearIconClass(size: InputSize): string {
	return inputVariants({ size }).decoratorIcon();
}

/** The counter's colour: muted, and destructive once the list is past its limit. */
export function resolveTagInputCounterColor(isOverflowing: boolean): "muted" | "destructive" {
	return isOverflowing ? "destructive" : "muted";
}

/**
 * The chip one tag is drawn as. At rest it is the caller's `chipVariant` in
 * the default colour; armed for removal by a first Backspace it turns soft
 * destructive — Chip's own tone, so no colour is invented here.
 */
export function resolveTagInputChip({
	size,
	variant,
	isPendingRemove,
}: {
	size: InputSize;
	variant: ChipVariant;
	isPendingRemove: boolean;
}): { size: ChipSize; color: ChipColor; variant: ChipVariant } {
	const chipSize = TAG_INPUT_CHIP_SIZE[size];
	return isPendingRemove
		? { color: "destructive", size: chipSize, variant: "soft" }
		: { color: "default", size: chipSize, variant };
}

export type TagInputVariantProps = VariantProps<typeof tagInputVariants>;
