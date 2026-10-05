import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { ButtonLabelSize } from "../button/button.variants";
import type { ChipSize } from "../chip/chip.variants";
import { INPUT_SIZES, INPUT_VARIANTS, type InputSize } from "../input/input.variants";

/** Sizes are `Input`'s own tuple — the search bar is an `Input.Group`, so it has no scale of its own. */
export const SEARCH_BAR_SIZES = INPUT_SIZES;

/** Variants are `Input`'s own tuple, for the same reason. */
export const SEARCH_BAR_VARIANTS = INPUT_VARIANTS;

/** When the Cancel action is on screen. */
export const SEARCH_BAR_CANCEL_MODES = ["never", "focus", "always"] as const;

/** The box's corner: a capsule, or `Input`'s own ramp. */
export const SEARCH_BAR_SHAPES = ["pill", "rounded"] as const;

export type SearchBarSize = InputSize;
export type SearchBarVariant = (typeof SEARCH_BAR_VARIANTS)[number];
export type SearchBarCancelMode = (typeof SEARCH_BAR_CANCEL_MODES)[number];
export type SearchBarShape = (typeof SEARCH_BAR_SHAPES)[number];

/**
 * The chip a token is drawn as, per field size.
 *
 * Never a step above the field: a token has to sit inside the box's height with
 * room either side, and Chip's `md` beside an `sm` field would touch the border.
 */
export const SEARCH_BAR_TOKEN_CHIP_SIZE: Record<SearchBarSize, ChipSize> = {
	sm: "sm",
	md: "sm",
	lg: "md",
};

/** The Cancel button's step per field size — a button and a field of one size are level by token. */
export const SEARCH_BAR_CANCEL_BUTTON_SIZE: Record<SearchBarSize, ButtonLabelSize> = {
	sm: "sm",
	md: "md",
	lg: "lg",
};

/** How far a press outside the clear glyph still reaches it, in points. */
export const SEARCH_BAR_CLEAR_HIT_SLOP = 8;

/** The Cancel action's slide, in ms. */
export const SEARCH_BAR_CANCEL_DURATION = 200;

/** The clear button's fade, in ms. */
export const SEARCH_BAR_CLEAR_FADE_DURATION = 100;

/**
 * Layout for the parts of a search bar.
 *
 * Deliberately thin. The box — border, fill, height, padding, focus ring — is
 * `Input.Group`'s, drawn by `inputVariants`' `root` slot, and none of it is
 * restated here: the `field` slot adds only the shape's corner on top. A second
 * border or height would be a second definition of one box, and the drift
 * would be a pixel nobody notices until it ships. `search-bar.variants.test.ts`
 * asserts the slot stays free of chrome.
 *
 * `root` is the row holding the field and the Cancel action, with no gap: the
 * gap lives inside Cancel's own measured width, so it collapses with it rather
 * than leaving eight points of nothing beside a hidden button.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const searchBarVariants = tv({
	slots: {
		root: "flex-row items-center",
		field: "min-w-0 flex-1",
		tokens: "max-w-[60%] shrink grow-0",
		tokensContent: "flex-row items-center gap-1",
		cancel: "self-stretch overflow-hidden",
		cancelContent: "absolute start-0 top-0 bottom-0 justify-center ps-2",
		clear: "items-center justify-center",
	},
	variants: {
		shape: {
			pill: { field: "rounded-full" },
			rounded: {},
		},
	},
	defaultVariants: {
		shape: "pill",
	},
});

/**
 * The corner class a shape adds over `Input`'s own.
 *
 * `pill` is a capsule whatever the size. `rounded` adds nothing, so the box
 * keeps the ramp a plain field draws — `rounded-md` at `sm`, `rounded-lg` above —
 * and the two cannot drift.
 */
export function resolveSearchBarCorner(shape: SearchBarShape): string {
	return shape === "pill" ? "rounded-full" : "";
}

export type SearchBarSuffixState = {
	value: string;
	isLoading: boolean;
	isDisabled: boolean;
	isReadOnly: boolean;
};

/** What the box's trailing slot holds. */
export type SearchBarSuffix = "spinner" | "clear" | "none";

/**
 * What the trailing slot shows.
 *
 * A spinner outranks clear: a query is running, and clearing mid-flight is a
 * second thing to tap while the first is unanswered. Clear needs text to clear
 * and a field that can be edited. Focus is not consulted — a filled bar that
 * lost focus can still be cleared in one tap.
 */
export function resolveSearchBarSuffix({
	value,
	isLoading,
	isDisabled,
	isReadOnly,
}: SearchBarSuffixState): SearchBarSuffix {
	if (isLoading) return "spinner";
	if (value.length > 0 && !isDisabled && !isReadOnly) return "clear";
	return "none";
}

/** Whether the clear button is drawn. See {@link resolveSearchBarSuffix}. */
export function resolveSearchBarClearVisibility(state: SearchBarSuffixState): boolean {
	return resolveSearchBarSuffix(state) === "clear";
}

/**
 * Whether the Cancel action is on screen.
 *
 * `focus` follows focus alone, not the text: a bar that keeps its query after
 * the keyboard is dismissed is a filter in place, and a Cancel hanging beside
 * it would offer to throw the filter away. A disabled bar has nothing to cancel.
 */
export function resolveSearchBarCancelVisibility(
	mode: SearchBarCancelMode,
	{ isFocused, isDisabled = false }: { isFocused: boolean; hasValue: boolean; isDisabled?: boolean }
): boolean {
	if (isDisabled) return false;
	switch (mode) {
		case "never":
			return false;
		case "always":
			return true;
		case "focus":
			return isFocused;
	}
}

/** What a Backspace press on the field does to the tokens. */
export type SearchBarBackspace<T> = { kind: "remove"; token: T } | { kind: "none" };

/**
 * Backspace on an empty field removes the last token — the same move a mail
 * client's recipient field makes. While there is text, Backspace edits text.
 */
export function resolveTokenBackspace<T>(value: string, tokens: readonly T[] | undefined): SearchBarBackspace<T> {
	const last = tokens?.at(-1);
	if (value.length > 0 || last === undefined) return { kind: "none" };
	return { kind: "remove", token: last };
}

export type SearchBarVariantProps = VariantProps<typeof searchBarVariants>;
