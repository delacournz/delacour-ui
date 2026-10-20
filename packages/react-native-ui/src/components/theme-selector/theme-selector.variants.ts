import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { ToggleButtonGroupLayout, ToggleButtonSelectionMode } from "../toggle-button/toggle-button.variants";

/**
 * `segmented` joins the options into one run, each a glyph beside its label.
 * `cards` stands them apart as taller tiles, a larger glyph over the label.
 */
export const THEME_SELECTOR_VARIANTS = ["segmented", "cards"] as const;

/** The button's own label steps — a theme option always carries text. */
export const THEME_SELECTOR_SIZES = ["sm", "md", "lg"] as const;

export type ThemeSelectorVariant = (typeof THEME_SELECTOR_VARIANTS)[number];
export type ThemeSelectorSize = (typeof THEME_SELECTOR_SIZES)[number];

/**
 * Layout for the selector's parts. The paint is the toggle's — each option is a
 * `ToggleButton` drawn with a button variant — so nothing here names a colour.
 *
 * Every option is `flex-1`, so the choices share the row equally and the
 * selector fills its parent. A card overrides the button's fixed height with
 * `h-auto` and stacks its glyph over the label.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const themeSelectorVariants = tv({
	slots: {
		root: "w-full",
		option: "flex-1",
		icon: "",
	},
	variants: {
		variant: {
			segmented: {},
			cards: { root: "flex-nowrap", option: "h-auto flex-col" },
		},
		size: { sm: {}, md: {}, lg: {} },
	},
	compoundVariants: [
		{ variant: "cards", size: "sm", class: { option: "gap-1.5 py-2.5", icon: "size-icon-lg" } },
		{ variant: "cards", size: "md", class: { option: "gap-2 py-3", icon: "size-icon-xl" } },
		{ variant: "cards", size: "lg", class: { option: "gap-2.5 py-4", icon: "size-icon-2xl" } },
	],
	defaultVariants: {
		variant: "segmented",
		size: "md",
	},
});

export type ThemeSelectorVariantProps = VariantProps<typeof themeSelectorVariants>;

/** What the selector hands its `ToggleButton.Group` — see {@link resolveGroupProps}. */
export type ThemeSelectorGroupProps = {
	layout: ToggleButtonGroupLayout;
	selectionMode: Extract<ToggleButtonSelectionMode, "single">;
	isSelectionRequired: true;
};

/**
 * The group a variant renders on.
 *
 * Always one required choice: a theme is never "none", so a re-press of the
 * selected option does nothing rather than clearing it. `segmented` is an
 * attached run; `cards` is detached, so each tile keeps its own corners.
 *
 * Pure, so the whole matrix is reachable from `bun test`.
 */
export function resolveGroupProps(variant: ThemeSelectorVariant): ThemeSelectorGroupProps {
	return {
		isSelectionRequired: true,
		layout: variant === "cards" ? "detached" : "attached",
		selectionMode: "single",
	};
}

/**
 * Extra reach around an option, in points.
 *
 * The small step is 36pt tall, under the 44pt minimum target, so it reaches 4pt
 * further each way. `md` and `lg` already meet it.
 */
export function resolveOptionHitSlop(size: ThemeSelectorSize): number | undefined {
	return size === "sm" ? 4 : undefined;
}
