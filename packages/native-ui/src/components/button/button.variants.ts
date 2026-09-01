import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

export const BUTTON_VARIANTS = [
	"primary",
	"secondary",
	"tertiary",
	"outline",
	"ghost",
	"destructive",
	"destructive-soft",
] as const;

/** Sizes that hold a label. Horizontal padding; the width comes from the content. */
export const BUTTON_LABEL_SIZES = ["sm", "md", "lg"] as const;

/** Sizes with a square footprint, for a button whose only content is an icon. */
export const BUTTON_ICON_SIZES = ["icon-sm", "icon-md", "icon-lg"] as const;

/**
 * Every value `size` accepts.
 *
 * Derived rather than written out — a tuple key is not a class, so composing one
 * costs nothing. The class strings below are a different matter and are spelled
 * in full; see the note on the `size` axis.
 */
export const BUTTON_SIZES = [...BUTTON_LABEL_SIZES, ...BUTTON_ICON_SIZES] as const;

export const BUTTON_SPINNER_PLACEMENTS = ["start", "end", "only"] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonLabelSize = (typeof BUTTON_LABEL_SIZES)[number];
export type ButtonIconSize = (typeof BUTTON_ICON_SIZES)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type ButtonSpinnerPlacement = (typeof BUTTON_SPINNER_PLACEMENTS)[number];

/** Theme token whose value gives icons and text their colour on each surface. */
export const BUTTON_FOREGROUND_TOKEN: Record<ButtonVariant, string> = {
	primary: "primary-foreground",
	secondary: "secondary-foreground",
	tertiary: "tertiary-foreground",
	outline: "foreground",
	ghost: "foreground",
	destructive: "destructive-foreground",
	"destructive-soft": "destructive-soft-foreground",
};

/**
 * Styling for every part of a button.
 *
 * One slotted `tv()` rather than a call per part, so `size` and `variant` are
 * declared once.
 *
 * A size names tokens rather than raw utilities: `h-button-md` for the height,
 * `text-button-md` for the label, `rounded-button-md` for the corner,
 * `size-icon-md` for a composed glyph. The values live in `tokens.css`, so a
 * button's icon and the spinner that replaces it resolve to the same edge
 * length by construction rather than by two numbers happening to agree. `cn`
 * has to know these token names — see `lib/cn.ts`. The root holds no `text-*`
 * utility: a React Native `View` does not cascade colour to a `Text`
 * descendant, so label colour lives on the `label` slot and icon colour is
 * resolved from {@link BUTTON_FOREGROUND_TOKEN}.
 *
 * The corner belongs to the size axis and appears nowhere else — not on the
 * base, not on a variant — so exactly one `rounded-*` ever reaches the root and
 * a caller's `rounded-lg` has a single class to beat. Each step is half its own
 * height, which draws a capsule, and a circle on the square steps.
 *
 * `overflow-hidden` on the root is load-bearing rather than tidiness — a pressed
 * button fades to the edge of its own box, and the fade is clipped to the same
 * corner the button draws.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const buttonVariants = tv({
	slots: {
		root: "flex-row items-center justify-center gap-2 overflow-hidden border border-transparent",
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
			destructive: { root: "bg-destructive", label: "text-destructive-foreground" },
			"destructive-soft": { root: "bg-destructive-soft", label: "text-destructive-soft-foreground" },
		},
		// Six steps in two families, and a square is a step rather than a flag on
		// one. `icon-md` is `md` with its horizontal padding traded for a width
		// off the same token, so the two can never fight each other in the merge
		// the way a boolean crossed with a size had to.
		//
		// Written out rather than built. Tailwind scans source text, so a class
		// assembled at runtime — `h-button-${step}` — is never compiled and
		// silently draws nothing; see `styles/tokens.ts`. The tuples above are
		// keys, not classes, which is why those may be composed and these may not.
		//
		// A square carries no `gap`: it holds one child. That is also what keeps
		// each row on one line, which is the whole readability of the table.
		//
		// The square steps are reachable only through `size`, never through
		// loading. A definite width defeats the parent's `alignItems: stretch` —
		// a stretch-aligned child with a definite cross size resolves to
		// cross-*start* — so a full-width button that squared itself the moment
		// work began would snap to a small box flush against the left edge. That
		// is why `spinnerPlacement="only"` swaps the content and leaves the
		// footprint exactly as the caller sized it.
		size: {
			sm: { root: "h-button-sm gap-1.5 rounded-button-sm px-3", label: "text-button-sm", icon: "size-icon-sm" },
			md: { root: "h-button-md rounded-button-md px-4", label: "text-button-md", icon: "size-icon-md" },
			lg: { root: "h-button-lg rounded-button-lg px-5", label: "text-button-lg", icon: "size-icon-lg" },
			"icon-sm": { root: "h-button-sm w-button-sm rounded-button-sm", label: "text-button-sm", icon: "size-icon-sm" },
			"icon-md": { root: "h-button-md w-button-md rounded-button-md", label: "text-button-md", icon: "size-icon-md" },
			"icon-lg": { root: "h-button-lg w-button-lg rounded-button-lg", label: "text-button-lg", icon: "size-icon-lg" },
		},
		// The empty `false` branches are load-bearing typing, not placeholders.
		// `tv` derives the prop type from the declared keys, so a map with only
		// `true` types the prop as `true` rather than `boolean` and rejects
		// `buttonVariants({ isLoading })`. The compound variant below would match
		// without them — `tv` compares against `defaultVariants` plus props and
		// never reads this map.
		isDisabled: { true: { root: "opacity-50" }, false: {} },
		isLoading: { true: {}, false: {} },
		isDimmedWhileLoading: { true: {}, false: {} },
	},
	compoundVariants: [
		// Loading is not a disabled state. The button keeps full contrast — the
		// spinner already says the press landed — unless the caller opts in.
		{ isLoading: true, isDimmedWhileLoading: true, class: { root: "opacity-50" } },
	],
	defaultVariants: {
		variant: "primary",
		size: "md",
		isDisabled: false,
		isLoading: false,
		isDimmedWhileLoading: false,
	},
});

/** What the spinner does to a button's children, once loading and placement are folded together. */
export type ButtonLayout = {
	/** The spinner has replaced the children entirely. */
	isSpinnerOnly: boolean;
	/** Side the spinner is composed onto, or null when no spinner is shown. */
	spinnerSide: "start" | "end" | null;
};

/**
 * Folds `isLoading` and `spinnerPlacement` into the facts the content needs.
 *
 * It says nothing about the footprint, and that is the point: `only` swaps the
 * content out and leaves the button exactly the size the caller asked for. A
 * square is a `size`, so `only` cannot reach it — see the note on the `size`
 * axis for the `alignItems: stretch` failure that rules out earning one here.
 *
 * Pure, so the whole matrix is reachable from `bun test`. See AGENTS.md.
 */
export function resolveButtonLayout({
	isLoading = false,
	spinnerPlacement = "start",
}: {
	isLoading?: boolean;
	spinnerPlacement?: ButtonSpinnerPlacement;
}): ButtonLayout {
	if (!isLoading) return { isSpinnerOnly: false, spinnerSide: null };
	if (spinnerPlacement === "only") return { isSpinnerOnly: true, spinnerSide: null };
	return { isSpinnerOnly: false, spinnerSide: spinnerPlacement };
}

/**
 * Index of the child the spinner should replace, or null to insert one.
 *
 * A loading button swaps its icon for the spinner rather than showing both.
 * Adding one would push the label sideways the moment work started and pull it
 * back when it finished — and with the spinner and the icon drawn at the same
 * `size-icon-*` token, replacing costs no layout at all.
 *
 * Only the child at the named edge is a candidate — the first at `start`, the
 * last at `end`. An icon on the other side is left alone and the spinner is
 * inserted at the edge instead: `spinnerPlacement` says where the caller wants
 * the spinner, so taking the one icon a button holds regardless of which side
 * it sits on would draw the spinner opposite the side that was asked for.
 *
 * Pure, so the whole matrix is reachable from `bun test`. See AGENTS.md.
 */
export function resolveSpinnerSwapIndex(isIcon: readonly boolean[], side: "start" | "end"): number | null {
	const index = side === "start" ? 0 : isIcon.length - 1;
	return isIcon[index] === true ? index : null;
}

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
