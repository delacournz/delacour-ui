import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

export const BUTTON_VARIANTS = [
	"primary",
	"secondary",
	"tertiary",
	"outline",
	"ghost",
	"danger",
	"danger-soft",
] as const;

export const BUTTON_SIZES = ["sm", "md", "lg"] as const;

export const BUTTON_SPINNER_PLACEMENTS = ["start", "end", "only"] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type ButtonSpinnerPlacement = (typeof BUTTON_SPINNER_PLACEMENTS)[number];

/** Theme token whose value gives icons and text their colour on each surface. */
export const BUTTON_FOREGROUND_TOKEN: Record<ButtonVariant, string> = {
	primary: "primary-foreground",
	secondary: "secondary-foreground",
	tertiary: "tertiary-foreground",
	outline: "foreground",
	ghost: "foreground",
	danger: "danger-foreground",
	"danger-soft": "danger-soft-foreground",
};

/**
 * Styling for every part of a button.
 *
 * One slotted `tv()` rather than a call per part, so `size` and `variant` are
 * declared once.
 *
 * A size names tokens rather than raw utilities: `h-button-md` for the height,
 * `text-button-md` for the label, `size-icon-md` for a composed glyph. The
 * values live in `tokens.css`, so a button's icon and the spinner that replaces
 * it resolve to the same edge length by construction rather than by two numbers
 * happening to agree. `cn` has to know these token names — see `lib/cn.ts`. The root holds no `text-*` utility: a React Native `View` does
 * not cascade colour to a `Text` descendant, so label colour lives on the
 * `label` slot and icon colour is resolved from {@link BUTTON_FOREGROUND_TOKEN}.
 *
 * `overflow-hidden` on the root is load-bearing rather than tidiness — a pressed
 * button fades to the edge of its own box.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const buttonVariants = tv({
	slots: {
		root: "flex-row items-center justify-center gap-2 overflow-hidden rounded-lg border border-transparent",
		label: "text-center font-semibold",
		startContent: "items-center justify-center",
		endContent: "items-center justify-center",
		/** Edge length an `Icon` or `Spinner` composed into the button inherits. */
		icon: "",
	},
	variants: {
		variant: {
			primary: { root: "bg-primary", label: "text-primary-foreground" },
			secondary: { root: "bg-secondary", label: "text-secondary-foreground" },
			tertiary: { root: "bg-tertiary", label: "text-tertiary-foreground" },
			outline: { root: "border-border bg-transparent", label: "text-foreground" },
			ghost: { root: "border-transparent bg-transparent", label: "text-foreground" },
			danger: { root: "bg-danger", label: "text-danger-foreground" },
			"danger-soft": { root: "bg-danger-soft", label: "text-danger-soft-foreground" },
		},
		size: {
			sm: { root: "h-button-sm gap-1.5 rounded-md", label: "text-button-sm", icon: "size-icon-sm" },
			md: { root: "h-button-md", label: "text-button-md", icon: "size-icon-md" },
			lg: { root: "h-button-lg", label: "text-button-lg", icon: "size-icon-lg" },
		},
		// The empty `false` branches are load-bearing typing, not placeholders.
		// `tv` derives the prop type from the declared keys, so a map with only
		// `true` types the prop as `true` rather than `boolean` and rejects
		// `buttonVariants({ isIconOnly: layout.isIconOnly })`. The compound
		// variants below would match without them — `tv` compares against
		// `defaultVariants` plus props and never reads this map.
		isIconOnly: { true: {}, false: {} },
		isDisabled: { true: { root: "opacity-50" }, false: {} },
		isLoading: { true: {}, false: {} },
		isDimmedWhileLoading: { true: {}, false: {} },
	},
	compoundVariants: [
		// A square footprint replaces horizontal padding entirely, so the two
		// are declared together rather than fighting each other in the merge.
		{ isIconOnly: true, size: "sm", class: { root: "w-button-sm" } },
		{ isIconOnly: true, size: "md", class: { root: "w-button-md" } },
		{ isIconOnly: true, size: "lg", class: { root: "w-button-lg" } },
		{ isIconOnly: false, size: "sm", class: { root: "px-3" } },
		{ isIconOnly: false, size: "md", class: { root: "px-4" } },
		{ isIconOnly: false, size: "lg", class: { root: "px-5" } },
		// Loading is not a disabled state. The button keeps full contrast — the
		// spinner already says the press landed — unless the caller opts in.
		{ isLoading: true, isDimmedWhileLoading: true, class: { root: "opacity-50" } },
	],
	defaultVariants: {
		variant: "primary",
		size: "md",
		isIconOnly: false,
		isDisabled: false,
		isLoading: false,
		isDimmedWhileLoading: false,
	},
});

/** Layout facts for a button, once loading state and spinner placement are folded together. */
export type ButtonLayout = {
	/** Square footprint. Loading never turns this on by itself. */
	isIconOnly: boolean;
	/** The spinner has replaced the children entirely. */
	isSpinnerOnly: boolean;
	/** Side the spinner is composed onto, or null when no spinner is shown. */
	spinnerSide: "start" | "end" | null;
};

/**
 * Folds `isLoading` and `spinnerPlacement` into the facts the root needs.
 *
 * `only` swaps the content out but leaves the footprint alone — it never squares
 * a button the caller did not already mark `isIconOnly`. Taking a fixed width
 * here would defeat the parent's `alignItems: stretch`, and a stretch-aligned
 * child with a definite cross size resolves to cross-*start*: a full-width
 * button would snap to a small box flush against the left edge the moment it
 * started loading. Pair `only` with `isIconOnly` when a square is wanted.
 *
 * Pure, so the whole matrix is reachable from `bun test`. See AGENTS.md.
 */
export function resolveButtonLayout({
	isIconOnly = false,
	isLoading = false,
	spinnerPlacement = "start",
}: {
	isIconOnly?: boolean;
	isLoading?: boolean;
	spinnerPlacement?: ButtonSpinnerPlacement;
}): ButtonLayout {
	if (!isLoading) return { isIconOnly, isSpinnerOnly: false, spinnerSide: null };
	if (spinnerPlacement === "only") return { isIconOnly, isSpinnerOnly: true, spinnerSide: null };
	return { isIconOnly, isSpinnerOnly: false, spinnerSide: spinnerPlacement };
}

/**
 * Index of the child the spinner should replace, or null to insert one.
 *
 * A loading button swaps its icon for the spinner rather than showing both.
 * Adding one would push the label sideways the moment work started and pull it
 * back when it finished — and with the spinner and the icon drawn at the same
 * `size-icon-*` token, replacing costs no layout at all.
 *
 * `start` takes the first icon and `end` the last, so the spinner lands on the
 * side the caller asked for even when the button holds an icon at both ends.
 * With no icon to take there is nothing to swap and the caller gets the
 * inserted spinner the button has always shown.
 *
 * Pure, so the whole matrix is reachable from `bun test`. See AGENTS.md.
 */
export function resolveSpinnerSwapIndex(isIcon: readonly boolean[], side: "start" | "end"): number | null {
	const index = side === "start" ? isIcon.indexOf(true) : isIcon.lastIndexOf(true);
	return index === -1 ? null : index;
}

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
