import { tv, type VariantProps } from "tailwind-variants";

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

/** Icon edge length paired with each button size, in points. */
export const BUTTON_ICON_SIZE: Record<ButtonSize, number> = {
	sm: 16,
	md: 18,
	lg: 20,
};

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
 * Styling for the button root.
 *
 * Holds no `text-*` utility: a React Native `View` does not cascade colour to a
 * `Text` descendant, so label colour lives in {@link buttonLabelVariants} and
 * icon colour is resolved from {@link BUTTON_FOREGROUND_TOKEN}.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const buttonVariants = tv({
	base: "flex-row items-center justify-center gap-2 rounded-lg border border-transparent",
	variants: {
		variant: {
			primary: "bg-primary",
			secondary: "bg-secondary",
			tertiary: "bg-tertiary",
			outline: "border-border bg-transparent",
			ghost: "border-transparent bg-transparent",
			danger: "bg-danger",
			"danger-soft": "bg-danger-soft",
		},
		size: {
			sm: "h-9 gap-1.5 rounded-md",
			md: "h-11",
			lg: "h-13",
		},
		isIconOnly: {
			true: "",
			false: "",
		},
		isDisabled: {
			true: "opacity-50",
			false: "",
		},
		isLoading: {
			true: "",
			false: "",
		},
		isDimmedWhileLoading: {
			true: "",
			false: "",
		},
	},
	compoundVariants: [
		// A square footprint replaces horizontal padding entirely, so the two
		// are declared together rather than fighting each other in the merge.
		{ isIconOnly: true, size: "sm", class: "w-9" },
		{ isIconOnly: true, size: "md", class: "w-11" },
		{ isIconOnly: true, size: "lg", class: "w-13" },
		{ isIconOnly: false, size: "sm", class: "px-3" },
		{ isIconOnly: false, size: "md", class: "px-4" },
		{ isIconOnly: false, size: "lg", class: "px-5" },
		// Loading is not a disabled state. The button keeps full contrast — the
		// spinner already says the press landed — unless the caller opts in.
		{ isLoading: true, isDimmedWhileLoading: true, class: "opacity-50" },
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
	/** Square footprint — an icon-only button, or one showing nothing but its spinner. */
	isIconOnly: boolean;
	/** The spinner has replaced the children entirely. */
	isSpinnerOnly: boolean;
	/** Side the spinner is composed onto, or null when no spinner is shown. */
	spinnerSide: "start" | "end" | null;
};

/**
 * Folds `isLoading` and `spinnerPlacement` into the facts the root needs.
 *
 * `only` collapses to the same square footprint as `isIconOnly` rather than
 * introducing a second width axis in {@link buttonVariants}: a square that also
 * matched the `px-*` compounds would squeeze its own content, and tailwind-merge
 * would not resolve it because width and padding do not conflict.
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
	if (spinnerPlacement === "only") return { isIconOnly: true, isSpinnerOnly: true, spinnerSide: null };
	return { isIconOnly, isSpinnerOnly: false, spinnerSide: spinnerPlacement };
}

/** Styling for the button label. Owns the text colour for each surface. */
export const buttonLabelVariants = tv({
	base: "text-center font-semibold",
	variants: {
		variant: {
			primary: "text-primary-foreground",
			secondary: "text-secondary-foreground",
			tertiary: "text-tertiary-foreground",
			outline: "text-foreground",
			ghost: "text-foreground",
			danger: "text-danger-foreground",
			"danger-soft": "text-danger-soft-foreground",
		},
		size: {
			sm: "text-sm",
			md: "text-base",
			lg: "text-lg",
		},
	},
	defaultVariants: {
		variant: "primary",
		size: "md",
	},
});

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
