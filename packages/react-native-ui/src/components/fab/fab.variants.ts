import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { IconSize } from "../icon/icon.variants";

/** 44, 56 and 64pt — `--spacing-fab-*` in `tokens.css`. */
export const FAB_SIZES = ["sm", "md", "lg"] as const;

export const FAB_VARIANTS = ["primary", "secondary", "surface", "destructive"] as const;

/** Where a pinned fab sits along the bottom edge. Logical, so it flips under RTL. */
export const FAB_PLACEMENTS = ["bottom-start", "bottom-center", "bottom-end"] as const;

/** Which side of an action's button its label chip sits on. */
export const FAB_LABEL_SIDES = ["start", "end", "top"] as const;

export type FabSize = (typeof FAB_SIZES)[number];
export type FabVariant = (typeof FAB_VARIANTS)[number];
export type FabPlacement = (typeof FAB_PLACEMENTS)[number];
export type FabLabelSide = (typeof FAB_LABEL_SIDES)[number];

/** Distance from the screen's edges, before the safe-area inset. */
export const FAB_DEFAULT_OFFSET = 16;

/**
 * How far behind the one before it each action starts, as a fraction of the
 * dial's spring. 0.08 keeps a four-action dial's last window at three quarters
 * of the spring, long enough to read as a cascade rather than a pop.
 */
export const FAB_DIAL_STAGGER = 0.08;

/** The reduced-motion fade, and the glyph's turn under it, in ms. */
export const FAB_REDUCED_MOTION_MS = 150;

/** The glyph's turn at a fully open dial: a plus becomes a cross. */
export const FAB_OPEN_ROTATION_DEG = 45;

/**
 * Theme token whose value colours a composed icon on each surface.
 *
 * Read through `useThemeColor` for an `Icon`'s `color`; the label reads the same
 * token as a `text-*` class in {@link fabVariants}, and a test holds the two in
 * step.
 */
export const FAB_FOREGROUND_TOKEN: Record<FabVariant, string> = {
	primary: "primary-foreground",
	secondary: "secondary-foreground",
	surface: "elevated-foreground",
	destructive: "destructive-foreground",
};

/**
 * The step on the shared icon scale a fab's glyph is drawn at.
 *
 * Indexed rather than restated, the way a button's icon is: `sm` is a step
 * down because a 44pt circle with a 20pt glyph reads as crowded, while 56 and 64
 * both carry the larger glyph with room to spare.
 */
export const FAB_ICON_SIZE: Record<FabSize, IconSize> = {
	sm: "md",
	md: "lg",
	lg: "lg",
};

export function resolveFabIconSize(size: FabSize): IconSize {
	return FAB_ICON_SIZE[size];
}

/**
 * The side of an action's button its label chip sits on: the side facing into
 * the screen, so the chip never runs off the edge the dial is pinned to.
 */
export function resolveLabelSide(placement: FabPlacement): FabLabelSide {
	switch (placement) {
		case "bottom-start":
			return "end";
		case "bottom-center":
			return "top";
		default:
			return "start";
	}
}

export type FabPlacementStyle =
	| { position: "absolute"; bottom: number; start: number }
	| { position: "absolute"; bottom: number; end: number }
	| { position: "absolute"; bottom: number; start: 0; end: 0; alignItems: "center" };

/**
 * The style of the box a pinned fab sits in.
 *
 * Bottom is the offset plus the safe-area inset, so a fab on a phone with a home
 * indicator clears it by the same distance it clears the side.
 *
 * Centre spans the row and centres inside it rather than reaching for
 * `alignSelf`: an absolute child's `alignSelf` is read on the parent's cross
 * axis, which is horizontal only when the parent is a column — a fab written
 * into a `flex-row` would centre vertically instead. Spanning costs touches
 * nothing because the box is `pointerEvents="box-none"`.
 *
 * Logical edges only (`start` / `end`), so a right-to-left layout flips with no
 * code here.
 */
export function resolveFabPlacementStyle({
	placement,
	offset,
	insetBottom,
}: {
	placement: FabPlacement;
	offset: number;
	insetBottom: number;
}): FabPlacementStyle {
	const bottom = offset + insetBottom;
	switch (placement) {
		case "bottom-start":
			return { position: "absolute", bottom, start: offset };
		case "bottom-center":
			return { position: "absolute", bottom, start: 0, end: 0, alignItems: "center" };
		default:
			return { position: "absolute", bottom, end: offset };
	}
}

/**
 * One action's share of the dial's spring, 0–1.
 *
 * One spring drives the whole dial; each action reads its own window of it,
 * starting `index × stagger` in and running to the end. Index 0 is the action
 * nearest the trigger, so the dial unfolds outward. Because every window is a
 * pure function of the one value, reversing halfway through opening simply runs
 * the same windows backwards — there are no per-action timers to fall out of
 * step.
 *
 * Clamped at both ends because the spring overshoots, and floored on the window
 * so a stagger too wide for the count degrades to a step rather than a NaN —
 * a NaN written into a style freezes the action where it stands.
 *
 * A worklet, so the dial's animated styles call it on the UI thread.
 */
export function resolveDialProgress({
	open,
	index,
	count,
	stagger,
}: {
	open: number;
	index: number;
	count: number;
	stagger: number;
}): number {
	"worklet";
	const span = 1 - Math.max(count - 1, 0) * stagger;
	const window = span > 0.0001 ? span : 0.0001;
	const local = (open - index * stagger) / window;
	return local < 0 ? 0 : local > 1 ? 1 : local;
}

/**
 * Styling for every part of a fab and its dial.
 *
 * One slotted `tv()` so `size` and `variant` are declared once. A size names
 * tokens: `size-fab-md` for a round fab, `h-fab-md` for an extended one, and the
 * action anchor's `w-fab-md`, which centres a small action button on the
 * trigger's own centre line. The values live in `tokens.css`.
 *
 * The root holds no `text-*` (rule 1); the label slot carries the colour, and a
 * composed icon reads {@link FAB_FOREGROUND_TOKEN}.
 *
 * `shadow-lg` is deliberate and unique. Nothing else in the package casts a
 * shadow; a fab is the one thing floating over content, and without one it
 * reads as a sticker on the list rather than a control above it. No
 * `overflow-hidden` on the root for the same reason — a clip would cut the
 * shadow off on Android.
 *
 * Free of React Native imports so it stays unit-testable.
 */
export const fabVariants = tv({
	slots: {
		root: "flex-row items-center justify-center rounded-full shadow-lg",
		label: "text-button-md font-medium",
		scrim: "absolute inset-0 bg-overlay",
		dial: "gap-3",
		action: "items-center gap-3",
		actionAnchor: "items-center",
		actionButton: "size-fab-sm items-center justify-center rounded-full border border-border bg-elevated shadow-lg",
		actionLabel: "rounded-md bg-popover px-2 py-1",
		actionLabelText: "text-popover-foreground text-sm",
	},
	variants: {
		size: {
			sm: { actionAnchor: "w-fab-sm" },
			md: { actionAnchor: "w-fab-md" },
			lg: { actionAnchor: "w-fab-lg" },
		},
		variant: {
			primary: { root: "bg-primary", label: "text-primary-foreground" },
			secondary: { root: "bg-secondary", label: "text-secondary-foreground" },
			surface: { root: "border border-border bg-elevated", label: "text-elevated-foreground" },
			destructive: { root: "bg-destructive", label: "text-destructive-foreground" },
		},
		isExtended: {
			true: { root: "gap-2 px-5" },
			false: {},
		},
		isDisabled: {
			true: { root: "opacity-50" },
			false: {},
		},
		labelSide: {
			start: { dial: "items-end", action: "flex-row" },
			end: { dial: "items-start", action: "flex-row-reverse" },
			top: { dial: "items-center", action: "flex-col" },
		},
	},
	compoundVariants: [
		{ size: "sm", isExtended: false, class: { root: "size-fab-sm" } },
		{ size: "md", isExtended: false, class: { root: "size-fab-md" } },
		{ size: "lg", isExtended: false, class: { root: "size-fab-lg" } },
		{ size: "sm", isExtended: true, class: { root: "h-fab-sm" } },
		{ size: "md", isExtended: true, class: { root: "h-fab-md" } },
		{ size: "lg", isExtended: true, class: { root: "h-fab-lg" } },
	],
	defaultVariants: {
		size: "md",
		variant: "primary",
		isExtended: false,
		isDisabled: false,
		labelSide: "start",
	},
});

export type FabVariantProps = VariantProps<typeof fabVariants>;
