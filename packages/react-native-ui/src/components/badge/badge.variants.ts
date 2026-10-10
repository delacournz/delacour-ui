import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** How the surface is painted. Orthogonal to {@link BADGE_COLORS}. */
export const BADGE_VARIANTS = ["solid", "soft", "outline", "ghost"] as const;

/** What the surface means. Orthogonal to {@link BADGE_VARIANTS}. */
export const BADGE_COLORS = ["default", "primary", "success", "warning", "destructive", "info"] as const;

export const BADGE_SIZES = ["sm", "md", "lg"] as const;

/** The corner of its parent a badge can be pinned to. */
export const BADGE_PLACEMENTS = ["top-right", "top-left", "bottom-right", "bottom-left"] as const;

export type BadgeVariant = (typeof BADGE_VARIANTS)[number];
export type BadgeColor = (typeof BADGE_COLORS)[number];
export type BadgeSize = (typeof BADGE_SIZES)[number];
export type BadgePlacement = (typeof BADGE_PLACEMENTS)[number];

/**
 * What a badge draws — decided by what it was given, never by a flag.
 *
 * - `label` — it has children. A capsule round its text.
 * - `count` — it has a `count`. A number, a circle while it is one digit.
 * - `dot` — it has neither. A mark that says only that there is something.
 */
export type BadgeShape = "label" | "count" | "dot";

/**
 * Theme token whose value gives an `Icon` composed into the badge its colour.
 *
 * The badge's counterpart to `BUTTON_FOREGROUND_TOKEN`, and it exists for the
 * same reason: a colour that has to reach an SVG paint prop cannot be a class.
 * Every entry names the token its own `label` slot resolves to, so a glyph and
 * the text beside it are always the same shade — a test asserts the pair.
 *
 * Nested rather than flattened to twenty-four keys so adding a colour is a
 * compile error in four places instead of a silent gap in one.
 */
export const BADGE_FOREGROUND_TOKEN: Record<BadgeVariant, Record<BadgeColor, string>> = {
	solid: {
		default: "secondary-foreground",
		primary: "primary-foreground",
		success: "success-foreground",
		warning: "warning-foreground",
		destructive: "destructive-foreground",
		info: "info-foreground",
	},
	soft: {
		default: "muted-foreground",
		primary: "tertiary-foreground",
		success: "success-soft-foreground",
		warning: "warning-soft-foreground",
		destructive: "destructive-soft-foreground",
		info: "info-soft-foreground",
	},
	outline: {
		default: "muted-foreground",
		primary: "foreground",
		success: "success-soft-foreground",
		warning: "warning-soft-foreground",
		destructive: "destructive-soft-foreground",
		info: "info-soft-foreground",
	},
	ghost: {
		default: "muted-foreground",
		primary: "foreground",
		success: "success-soft-foreground",
		warning: "warning-soft-foreground",
		destructive: "destructive-soft-foreground",
		info: "info-soft-foreground",
	},
};

/**
 * The paint for every variant and colour pair — what `badgeVariants` spreads
 * into its `compoundVariants`.
 *
 * Exported because [`Chip`](../chip/AGENTS.md) rests on two of these rows. It
 * spreads `soft` and `outline` into its own `tv()` rather than restating them,
 * so a soft `success` chip beside a soft `success` badge is one shade by
 * construction and not by a test catching the drift afterwards. The class
 * strings are literal here, which is all Tailwind's static scanner needs.
 *
 * Keyed by variant so adding a colour is a compile error in four places — the
 * shape `BADGE_FOREGROUND_TOKEN` takes, for the same reason.
 */
export const BADGE_SURFACE_CELLS = {
	solid: [
		{ variant: "solid", color: "default", class: { root: "bg-secondary", label: "text-secondary-foreground" } },
		{ variant: "solid", color: "primary", class: { root: "bg-primary", label: "text-primary-foreground" } },
		{ variant: "solid", color: "success", class: { root: "bg-success", label: "text-success-foreground" } },
		{ variant: "solid", color: "warning", class: { root: "bg-warning", label: "text-warning-foreground" } },
		{ variant: "solid", color: "destructive", class: { root: "bg-destructive", label: "text-destructive-foreground" } },
		{ variant: "solid", color: "info", class: { root: "bg-info", label: "text-info-foreground" } },
	],
	soft: [
		{ variant: "soft", color: "default", class: { root: "bg-muted", label: "text-muted-foreground" } },
		{ variant: "soft", color: "primary", class: { root: "bg-tertiary", label: "text-tertiary-foreground" } },
		{ variant: "soft", color: "success", class: { root: "bg-success-soft", label: "text-success-soft-foreground" } },
		{ variant: "soft", color: "warning", class: { root: "bg-warning-soft", label: "text-warning-soft-foreground" } },
		{
			variant: "soft",
			color: "destructive",
			class: { root: "bg-destructive-soft", label: "text-destructive-soft-foreground" },
		},
		{ variant: "soft", color: "info", class: { root: "bg-info-soft", label: "text-info-soft-foreground" } },
	],
	outline: [
		{ variant: "outline", color: "default", class: { root: "border-border", label: "text-muted-foreground" } },
		{ variant: "outline", color: "primary", class: { root: "border-primary", label: "text-foreground" } },
		{ variant: "outline", color: "success", class: { root: "border-success", label: "text-success-soft-foreground" } },
		{ variant: "outline", color: "warning", class: { root: "border-warning", label: "text-warning-soft-foreground" } },
		{
			variant: "outline",
			color: "destructive",
			class: { root: "border-destructive", label: "text-destructive-soft-foreground" },
		},
		{ variant: "outline", color: "info", class: { root: "border-info", label: "text-info-soft-foreground" } },
	],
	ghost: [
		{ variant: "ghost", color: "default", class: { label: "text-muted-foreground" } },
		{ variant: "ghost", color: "primary", class: { label: "text-foreground" } },
		{ variant: "ghost", color: "success", class: { label: "text-success-soft-foreground" } },
		{ variant: "ghost", color: "warning", class: { label: "text-warning-soft-foreground" } },
		{ variant: "ghost", color: "destructive", class: { label: "text-destructive-soft-foreground" } },
		{ variant: "ghost", color: "info", class: { label: "text-info-soft-foreground" } },
	],
} as const satisfies {
	[Variant in BadgeVariant]: readonly {
		variant: Variant;
		color: BadgeColor;
		class: { root?: string; label: string };
	}[];
};

/**
 * Styling for every part of a badge.
 *
 * Two axes rather than one. `variant` says how the surface is painted and
 * `color` says what it means, so a caller reaches `soft` + `warning` without the
 * library having to enumerate a `warning-soft` name for it — the combinatorial
 * growth `Button`'s single axis would pay here, where six semantic colours are
 * the point of the component rather than an afterthought. Neither axis carries a
 * surface on its own, so the twenty-four real pairings live in
 * {@link BADGE_SURFACE_CELLS}.
 *
 * `self-start` is load-bearing. A badge is sized by its content, and inside a
 * gap column every child is stretch-aligned by default — without it, a one-word
 * badge spans the whole screen.
 *
 * `border border-transparent` sits in the base rather than on `outline` alone.
 * A border declared only where it is visible makes the badge two points wider
 * the moment a caller switches variant; reserving it in the box means `outline`
 * changes nothing but the colour.
 *
 * A size is padding and never a height. `Text` respects OS font scaling, so a
 * fixed height clips the label at a large accessibility step instead of growing
 * with it, and unlike `h-button-*` a badge lines up against no chrome that would
 * force the number. The icon step indexes the shared `--spacing-icon-*` scale so
 * a glyph in a badge matches every other glyph in the library.
 *
 * `shape` is what the badge draws — see {@link BadgeShape}. A **count** keeps
 * the label's paint and type scale and tightens the box round it: no vertical
 * padding, and a `min-w-*` equal to the height that leaves, so one digit sits in
 * a circle and three in a capsule. A **dot** is a fixed square edge with no
 * padding and no border — the one shape with nothing in it to scale — and its
 * cells come after the surface cells, so tailwind-merge lets them win whatever
 * the variant: a dot is the same solid mark on all four, because a soft tint six
 * points wide is not a status and a ghost one is not there. A `default` dot
 * takes `foreground` rather than solid's `secondary`, which this theme sets a
 * hair from the page.
 *
 * `placement` pins the badge to a corner of its parent. It is pinned by its
 * **inner** edge — `left-full` for a right-hand corner — and pulled back over
 * the corner by a negative margin, so a count that gains a digit grows away from
 * the glyph underneath rather than across it. A dot overlaps less than a count:
 * it is a third the size, and the same pull would bury it.
 *
 * The neutral end of the matrix reuses tokens the theme already has instead of
 * minting `--primary-soft`: this theme's `primary` is a near-black, whose
 * tint *is* the neutral fill, so a new token would duplicate `secondary` exactly.
 * `soft` takes `tertiary` for `primary` and `muted` for `default` — two fills the
 * theme already tunes per mode — which keeps all twenty-four cells distinct.
 *
 * The root holds no `text-*` utility: a React Native `View` does not cascade
 * colour to a `Text` descendant, so label colour lives on the `label` slot and
 * icon colour is resolved from {@link BADGE_FOREGROUND_TOKEN}.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const badgeVariants = tv({
	slots: {
		root: "flex-row items-center justify-center self-start rounded-full border border-transparent",
		label: "text-center font-medium",
		startContent: "items-center justify-center",
		endContent: "items-center justify-center",
		/**
		 * The content-sized box a placed badge is pinned to a corner of. `flex-row`
		 * is load-bearing: Yoga caps an absolute child at its parent's width when
		 * the parent is a column, and a `99+` over a 24pt glyph wraps onto two lines.
		 */
		anchor: "relative flex-row self-start",
		/** Edge length an `Icon` composed into the badge inherits. */
		icon: "",
	},
	variants: {
		// Neither axis paints a surface alone — see `compoundVariants`. What
		// each variant does carry is whether the box has a fill at all.
		variant: {
			solid: {},
			soft: {},
			outline: { root: "bg-transparent" },
			ghost: { root: "bg-transparent" },
		},
		color: {
			default: {},
			primary: {},
			success: {},
			warning: {},
			destructive: {},
			info: {},
		},
		size: {
			sm: {
				root: "gap-1 px-2 py-0.5",
				label: "text-xs",
				icon: "size-icon-xs",
			},
			md: {
				root: "gap-1.5 px-2.5 py-1",
				label: "text-sm",
				icon: "size-icon-sm",
			},
			lg: {
				root: "gap-2 px-3 py-1.5",
				label: "text-base",
				icon: "size-icon-md",
			},
		},
		// What the box holds — see `BadgeShape`. Sized per `size` below.
		shape: {
			label: {},
			count: {},
			dot: {},
		},
		// Pinned by the inner edge and pulled back over the corner, so a longer
		// count grows outward. Absent, the badge stays in the flow.
		placement: {
			"top-right": { root: "absolute bottom-full left-full -mb-2 -ml-2" },
			"top-left": { root: "absolute right-full bottom-full -mr-2 -mb-2" },
			"bottom-right": { root: "absolute top-full left-full -mt-2 -ml-2" },
			"bottom-left": { root: "absolute top-full right-full -mt-2 -mr-2" },
		},
	},
	compoundVariants: [
		...BADGE_SURFACE_CELLS.solid,
		...BADGE_SURFACE_CELLS.soft,
		...BADGE_SURFACE_CELLS.outline,
		...BADGE_SURFACE_CELLS.ghost,

		// A count: no vertical padding, and a floor on the width equal to the
		// height that leaves — the label's line plus the border.
		{ shape: "count", size: "sm", class: { root: "min-w-4.5 px-1 py-0" } },
		{ shape: "count", size: "md", class: { root: "min-w-5.5 px-1.5 py-0" } },
		{ shape: "count", size: "lg", class: { root: "min-w-6.5 px-2 py-0" } },

		{ shape: "dot", size: "sm", class: { root: "size-1.5 border-0 p-0" } },
		{ shape: "dot", size: "md", class: { root: "size-2 border-0 p-0" } },
		{ shape: "dot", size: "lg", class: { root: "size-2.5 border-0 p-0" } },

		// After the surface cells, so a dot is solid in its colour on any variant.
		{ shape: "dot", color: "default", class: { root: "bg-foreground" } },
		{ shape: "dot", color: "primary", class: { root: "bg-primary" } },
		{ shape: "dot", color: "success", class: { root: "bg-success" } },
		{ shape: "dot", color: "warning", class: { root: "bg-warning" } },
		{ shape: "dot", color: "destructive", class: { root: "bg-destructive" } },
		{ shape: "dot", color: "info", class: { root: "bg-info" } },

		{ shape: "dot", placement: "top-right", class: { root: "-mb-1.5 -ml-1.5" } },
		{ shape: "dot", placement: "top-left", class: { root: "-mr-1.5 -mb-1.5" } },
		{ shape: "dot", placement: "bottom-right", class: { root: "-mt-1.5 -ml-1.5" } },
		{ shape: "dot", placement: "bottom-left", class: { root: "-mt-1.5 -mr-1.5" } },
	],
	defaultVariants: {
		variant: "solid",
		color: "default",
		size: "md",
		shape: "label",
	},
});

/**
 * What the badge draws — see {@link BadgeShape}.
 *
 * Read from what the badge was given, the way a chip's mode is: a `count` makes
 * it a count even at zero, content makes it a label, and a badge with neither is
 * a dot — the rule `Avatar.Badge` follows for its presence dot.
 *
 * Pure, so `bun test` reaches it. See AGENTS.md.
 */
export function resolveBadgeShape({ count, hasChildren }: { count?: number; hasChildren: boolean }): BadgeShape {
	if (count !== undefined) return "count";
	return hasChildren ? "label" : "dot";
}

/**
 * The text a count badge shows, or `null` when it should not be drawn at all.
 *
 * Past `max` the number stops and a `+` says there is more: `99+` is as wide as
 * a count gets, so the badge cannot grow across the thing it sits on. Zero is
 * hidden unless `showZero` asks for it — nothing to report is nothing to draw —
 * and a negative or `NaN` count is read as zero rather than printed.
 */
export function resolveBadgeCount({
	count,
	max = 99,
	showZero = false,
}: {
	count: number;
	max?: number;
	showZero?: boolean;
}): string | null {
	const whole = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
	if (whole === 0) return showZero ? "0" : null;
	return whole > max ? `${max}+` : String(whole);
}

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;
