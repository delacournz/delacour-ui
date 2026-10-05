import type { VariantProps } from "tailwind-variants";
import { cn } from "../../lib/cn";
import { tv } from "../../lib/tv";
import type { ChipColor, ChipSize } from "../chip/chip.variants";
import { type InputBoxState, type InputSize, resolveInputGroupClass } from "../input/input.variants";
import type { SelectOption, SelectSelectionMode } from "../select/select.types";
import { formatSelectedCount, resolveSelectTriggerClass, selectVariants } from "../select/select.variants";

/** How many chips the trigger draws before the rest fold into a `+N`. */
export const COMBOBOX_DEFAULT_MAX_CHIPS = 3;

/** How long a chip's layout transition takes as its neighbours enter and leave. */
export const COMBOBOX_CHIP_LAYOUT_MS = 150;

/**
 * Styling for the parts a combobox adds to Select's.
 *
 * **No new box and no new row.** The trigger is Select's — itself Input's box —
 * and the option rows are Select's `SelectOptionRow`, so a combobox under a
 * select under a text field is one column of the same control. What is here is
 * only what a combobox has and a select does not: the chip row, the `+N`, the
 * clear button and the row that accepts typed text.
 *
 * `createRow` stacks on Select's `row` slot and `createLabel` on its
 * `rowLabel`, so the create row is the same height and type as the options
 * under it.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const comboboxVariants = tv({
	slots: {
		/** The trigger's chips, wrapping. Takes the room the value text would. */
		chips: "flex-1 flex-row flex-wrap items-center",
		/** The `+N` past the chip cap. Layout only — it is a `Chip` and owns its paint. */
		chipOverflow: "",
		/** The trigger's clear button, before the chevron. */
		clear: "items-center justify-center",
		createRow: "",
		createLabel: "",
		/** The sheet's title, chips, search field and result count, above the rows. */
		header: "gap-3 pb-3",
		/** The result count under the search field. */
		results: "text-muted-foreground",
		empty: "items-center justify-center py-8",
		/** Overrides the sheet's list gutter gap: rows touch, the way a list's do. */
		sheetBody: "gap-0",
	},
	variants: {
		variant: { primary: {}, secondary: {} },
		size: {
			sm: { chips: "gap-1", clear: "size-icon-sm", results: "text-xs" },
			md: { chips: "gap-1.5", clear: "size-icon-md", results: "text-sm" },
			lg: { chips: "gap-2", clear: "size-icon-lg", results: "text-sm" },
		},
	},
	defaultVariants: { variant: "primary", size: "md" },
});

export type ComboboxVariantProps = VariantProps<typeof comboboxVariants>;

/**
 * The class the trigger wears.
 *
 * Showing text, it is Select's trigger to the class — the test sweeps every
 * cell. Showing chips, it is Input's **multiline** box instead: the fixed
 * height becomes a floor and the vertical padding returns, so wrapped chips
 * grow the field the way a textarea grows with its text, rather than spilling
 * out of a box the height of one line.
 *
 * Pure, so the whole matrix is reachable from `bun test`. See AGENTS.md.
 */
export function resolveComboboxTriggerClass({
	hasChips,
	className,
	...state
}: Pick<InputBoxState, "variant" | "size" | "isDisabled" | "isFocused" | "isInvalid"> & {
	hasChips: boolean;
	className?: string;
}): string {
	if (!hasChips) return resolveSelectTriggerClass({ ...state, className });
	const own = selectVariants({ size: state.size, variant: state.variant }).trigger();
	return cn(resolveInputGroupClass({ ...state, className: own, isMultiline: true }), className);
}

/**
 * The chip size for a field size: `sm` at `sm` and `md`, `md` at `lg`.
 *
 * A chip of the field's own size would fill a one-line field edge to edge;
 * a step down leaves the box's padding visible around it.
 */
export function resolveComboboxChipSize(size: InputSize): ChipSize {
	return size === "lg" ? "md" : "sm";
}

/** The chip's colour: destructive while one more Backspace would remove it. */
export function resolveComboboxChipColor(isPendingRemove: boolean): ChipColor {
	return isPendingRemove ? "destructive" : "default";
}

/**
 * How many chips to draw and how many the `+N` stands for.
 *
 * Past the cap the last visible slot goes to the `+N` itself, so the trigger
 * never shows more than `max` pills in all. A count is used rather than a
 * measured line limit: measuring would draw every chip once to throw most of
 * them away, and the trigger re-lays out on every pick.
 */
export function resolveVisibleChips({ count, max = COMBOBOX_DEFAULT_MAX_CHIPS }: { count: number; max?: number }): {
	visible: number;
	overflow: number;
} {
	if (count <= max) return { overflow: 0, visible: count };
	const visible = Math.max(0, max - 1);
	return { overflow: count - visible, visible };
}

/**
 * What the trigger announces as its value, or `undefined` while the
 * placeholder shows.
 *
 * Single reads the label. Multiple reads a count — the chips are on screen and
 * each is its own element, so reading every label again on the trigger would
 * say them twice.
 */
export function resolveComboboxTriggerText({
	selected,
	mode,
	formatSelectedCount: format = formatSelectedCount,
}: {
	selected: readonly SelectOption[];
	mode: SelectSelectionMode;
	formatSelectedCount?: (count: number) => string;
}): string | undefined {
	if (selected.length === 0) return undefined;
	return mode === "single" ? selected[0]?.label : format(selected.length);
}
