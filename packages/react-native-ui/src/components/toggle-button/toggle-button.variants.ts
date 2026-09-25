import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { ButtonVariant } from "../button/button.variants";

/**
 * How a toggle paints itself, off and on.
 *
 * `default` is a quiet fill that turns into the action colour; `outline` is a
 * bordered button that fills; `ghost` is bare until pressed and then takes the
 * quiet fill, which is what a toolbar of formatting marks wants.
 */
export const TOGGLE_BUTTON_VARIANTS = ["default", "outline", "ghost"] as const;

/**
 * `multiple` is a set of independent marks — bold *and* italic. `single` is an
 * either-or choice, where picking one clears the last.
 */
export const TOGGLE_BUTTON_SELECTION_MODES = ["single", "multiple"] as const;

/**
 * `attached` joins the members into one run through `Button.Group`, sharing a
 * corner and a seam. `detached` spaces them apart and wraps — a row of filters.
 */
export const TOGGLE_BUTTON_GROUP_LAYOUTS = ["attached", "detached"] as const;

export const TOGGLE_BUTTON_GROUP_ORIENTATIONS = ["horizontal", "vertical"] as const;

export type ToggleButtonVariant = (typeof TOGGLE_BUTTON_VARIANTS)[number];
export type ToggleButtonSelectionMode = (typeof TOGGLE_BUTTON_SELECTION_MODES)[number];
export type ToggleButtonGroupLayout = (typeof TOGGLE_BUTTON_GROUP_LAYOUTS)[number];
export type ToggleButtonGroupOrientation = (typeof TOGGLE_BUTTON_GROUP_ORIENTATIONS)[number];

/**
 * The `Button` variant each toggle variant draws with, off and on.
 *
 * A toggle owns no paint of its own. Every state is a button variant, so the
 * fill, the border, the label colour and the colour a composed `Icon` inherits
 * all come off `buttonVariants` and `BUTTON_FOREGROUND_TOKEN` — there is no
 * second table of colours here to drift from the button's. Every variant the
 * button already has draws with the same `border` box, so switching state never
 * resizes the toggle.
 *
 * No state is ever destructive: a pressed toggle is a choice, not a warning.
 */
export const TOGGLE_BUTTON_APPEARANCE: Record<ToggleButtonVariant, { off: ButtonVariant; on: ButtonVariant }> = {
	default: { off: "secondary", on: "primary" },
	outline: { off: "outline", on: "primary" },
	ghost: { off: "ghost", on: "secondary" },
};

/**
 * Styling for the group's box. The toggle itself is a `Button` and carries none.
 *
 * An `attached` group adds nothing: it renders a `Button.Group`, which already
 * owns the run's direction, its corners and its seams. A `detached` group is a
 * plain wrapping row, or a column, spaced by a gap — the one thing an attached
 * run must never have.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const toggleButtonVariants = tv({
	slots: {
		group: "",
	},
	variants: {
		layout: { attached: {}, detached: {} },
		orientation: { horizontal: {}, vertical: {} },
	},
	compoundVariants: [
		{ layout: "detached", orientation: "horizontal", class: { group: "flex-row flex-wrap gap-2" } },
		{ layout: "detached", orientation: "vertical", class: { group: "flex-col gap-2" } },
	],
	defaultVariants: {
		layout: "attached",
		orientation: "horizontal",
	},
});

/**
 * The `Button` variant a toggle draws with right now.
 *
 * Pure, so the whole matrix is reachable from `bun test`. See AGENTS.md.
 */
export function resolveToggleButtonVariant(variant: ToggleButtonVariant, isSelected: boolean): ButtonVariant {
	return TOGGLE_BUTTON_APPEARANCE[variant][isSelected ? "on" : "off"];
}

/**
 * The group's next selection after `value` is pressed, or `null` for no change.
 *
 * `null` rather than the same list back, so the group never re-notifies a caller
 * with a value it already holds — the same rule `Radio.Group` keeps for a
 * re-press of the current option.
 *
 * - `multiple` adds or removes `value`, keeping the order things were pressed in.
 * - `single` replaces the selection with `value`. A re-press of the selected one
 *   clears it, unless `isSelectionRequired`, when it is no change at all — a
 *   segmented choice like text alignment always has an answer.
 * - `isSelectionRequired` also refuses to empty a `multiple` group, so the last
 *   mark cannot be taken off.
 *
 * A controlled `single` group handed several values collapses to the one pressed
 * rather than carrying the others along.
 *
 * Pure, so the whole matrix is reachable from `bun test`. See AGENTS.md.
 */
export function resolveToggleSelection({
	current,
	value,
	selectionMode,
	isSelectionRequired = false,
}: {
	current: readonly string[];
	value: string;
	selectionMode: ToggleButtonSelectionMode;
	isSelectionRequired?: boolean;
}): string[] | null {
	const isSelected = current.includes(value);

	if (selectionMode === "single") {
		if (!isSelected) return [value];
		if (isSelectionRequired) return null;
		return [];
	}

	if (!isSelected) return [...current, value];
	const next = current.filter((entry) => entry !== value);
	if (isSelectionRequired && next.length === 0) return null;
	return next;
}

/** A toggle's announced role — see {@link resolveToggleButtonAccessibility}. */
export type ToggleButtonAccessibility =
	| { accessibilityRole: "togglebutton"; accessibilityState: { checked: boolean } }
	| { accessibilityRole: "radio"; accessibilityState: { selected: boolean } };

/**
 * What a screen reader is told a toggle is.
 *
 * A toggle standing alone, or one of a set of independent marks, is a
 * `togglebutton` that is checked or not — read out as on or off. A member of a
 * `single` group is a choice among options, which is a radio: announcing it as a
 * toggle would promise that pressing it again turns it off, and in a group that
 * requires a selection it does not.
 *
 * `null` is "not in a group".
 *
 * Pure, so the whole matrix is reachable from `bun test`. See AGENTS.md.
 */
export function resolveToggleButtonAccessibility(
	selectionMode: ToggleButtonSelectionMode | null,
	isSelected: boolean
): ToggleButtonAccessibility {
	if (selectionMode === "single") {
		return { accessibilityRole: "radio", accessibilityState: { selected: isSelected } };
	}
	return { accessibilityRole: "togglebutton", accessibilityState: { checked: isSelected } };
}

export type ToggleButtonVariantProps = VariantProps<typeof toggleButtonVariants>;
