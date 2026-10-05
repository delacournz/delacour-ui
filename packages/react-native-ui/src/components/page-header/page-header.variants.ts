import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import { AVATAR_SIZE_POINTS, type AvatarSize } from "../avatar/avatar.variants";

/** `card` is an isolated surface; `page` has none and its cover bleeds to the screen edges. */
export const PAGE_HEADER_VARIANTS = ["card", "page"] as const;

/** Where the face and the text sit. */
export const PAGE_HEADER_ALIGNS = ["center", "start"] as const;

/** How a stat lays out its value and label. */
export const PAGE_HEADER_STATS_LAYOUTS = ["stacked", "inline"] as const;

export type PageHeaderVariant = (typeof PAGE_HEADER_VARIANTS)[number];
export type PageHeaderAlign = (typeof PAGE_HEADER_ALIGNS)[number];
export type PageHeaderStatsLayout = (typeof PAGE_HEADER_STATS_LAYOUTS)[number];

/**
 * The cover's content height in points, before any inset it extends under.
 *
 * A number rather than a class because the cover's height is computed at
 * runtime — it grows by the status-bar inset in `page` — and a runtime height
 * cannot be a class (Tailwind's scanner is static).
 */
export const PAGE_HEADER_COVER_HEIGHT = 128;

/**
 * The ring around the header avatar, in points — the `avatarRing` slot's `p-1`.
 *
 * Restated as a number because the overlap is a runtime margin; a test pins the
 * two together so the face cannot drift off-centre on the cover's edge.
 */
export const PAGE_HEADER_RING_WIDTH = 4;

/**
 * Every theme token the header's classes or colour values name.
 *
 * A test asserts each is declared in both variants of `theme.css`, and that no
 * slot reaches for a colour class outside this list.
 */
export const PAGE_HEADER_TOKENS = [
	"background",
	"card",
	"border",
	"foreground",
	"muted-foreground",
	"primary",
	"primary-foreground",
] as const;

/** The verification rosette's glyph colour — the `primary-foreground` the `rosette` slot is filled against. */
export const PAGE_HEADER_ROSETTE_FOREGROUND_TOKEN = "primary-foreground";

/**
 * Styling for every part of a page header.
 *
 * **The ring is the fill the header sits on.** `bg-background` in `page`,
 * `bg-card` in `card`, so a face lifted over the cover is cut out of it by the
 * same colour as the ground below — never a grey or white halo.
 *
 * **A page header bleeds through the screen gutter.** `Screen`'s scrollables pad
 * their content by `px-screen-gutter`; the root takes the same amount back with
 * `-mx-screen-gutter` (`isBleeding`, set only inside a `Screen`) so the cover
 * meets both screen edges, and the parts below it restore the gutter on
 * themselves.
 *
 * **Full-width parts say so.** A centred root is `items-center`, which
 * shrink-wraps every child; the cover, content, actions and stats carry `w-full`
 * rather than `self-stretch`, so they keep the width without overriding the
 * parent's alignment — the rule `Avatar` follows.
 *
 * **Spacing is per part, not a root `gap`.** The avatar's lift is a negative
 * margin computed from its edge; a root gap would push it down by the gap and
 * off the cover's line. Each part carries its own top margin instead and the
 * overlapping avatar's inline margin replaces its own.
 *
 * **Stacked stats are equal-width cells.** `flex-1` on each, so with
 * "Followers", "Posts" and "Following" of different widths the middle one still
 * sits under the title.
 *
 * No view slot holds a `text-*` utility: a React Native `View` does not cascade
 * colour to a `Text` descendant. No shadow — nothing in this package casts one.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const pageHeaderVariants = tv({
	slots: {
		root: "",
		cover: "w-full overflow-hidden bg-background",
		coverFallback: "absolute inset-0",
		coverOverlay: "absolute inset-0",
		avatarRing: "mt-3 rounded-full p-1",
		rosette: "size-6 items-center justify-center rounded-full border-2 bg-primary",
		content: "mt-3 w-full gap-1",
		title: "",
		description: "",
		meta: "flex-row items-center gap-1",
		actions: "mt-4 w-full flex-row flex-wrap gap-2",
		stats: "mt-4 w-full flex-row",
		stat: "",
		statValue: "font-semibold text-foreground text-lg",
		statLabel: "",
		divider: "w-px bg-border",
	},
	variants: {
		variant: {
			card: {
				root: "overflow-hidden rounded-lg pb-4",
				avatarRing: "mx-4 bg-card",
				rosette: "border-card",
				content: "px-4",
				actions: "px-4",
				stats: "px-4",
			},
			page: {
				avatarRing: "mx-screen-gutter bg-background",
				rosette: "border-background",
				content: "px-screen-gutter",
				actions: "px-screen-gutter",
				stats: "px-screen-gutter",
			},
		},
		align: {
			center: {
				root: "items-center",
				content: "items-center",
				title: "text-center",
				description: "text-center",
				meta: "justify-center",
				actions: "justify-center",
				stats: "justify-center",
				statLabel: "text-center",
			},
			start: {
				root: "items-start",
				content: "items-start",
				title: "text-left",
				description: "text-left",
				meta: "justify-start",
				actions: "justify-start",
				stats: "justify-start",
				statLabel: "text-left",
			},
		},
		layout: {
			stacked: {
				stats: "items-stretch",
				stat: "flex-1 gap-0.5",
			},
			inline: {
				stats: "flex-wrap items-center gap-4",
				stat: "flex-row items-baseline gap-1",
				divider: "h-4",
			},
		},
		// Set only inside a `Screen`, whose scrollables pad their content by the
		// gutter. Outside one there is nothing to take back.
		isBleeding: { true: {}, false: {} },
	},
	compoundVariants: [
		{ variant: "page", isBleeding: true, class: { root: "-mx-screen-gutter" } },
		{ layout: "stacked", align: "center", class: { stat: "items-center" } },
		{ layout: "stacked", align: "start", class: { stat: "items-start" } },
	],
	defaultVariants: {
		variant: "page",
		align: "center",
		layout: "stacked",
		isBleeding: false,
	},
});

/**
 * The header avatar's size: the caller's, else `2xl` centred and `xl` on the
 * leading edge.
 *
 * A centred face is the screen's subject and leads at 96 points; on the leading
 * edge it shares the row's width with the text and steps down to 64.
 */
export function resolvePageHeaderAvatarSize(align: PageHeaderAlign, size?: AvatarSize): AvatarSize {
	return size ?? (align === "center" ? "2xl" : "xl");
}

/**
 * The avatar's top margin, in points: negative to lift it over the cover.
 *
 * Half the ringed face — `edge / 2 + ring` — so the face's middle sits on the
 * cover's bottom edge. Zero with no cover (there is nothing to lap, so an
 * explicit `isOverlapping` cannot conjure one) and zero when the caller opts out.
 */
export function resolvePageHeaderOverlap({
	avatarSize,
	ringWidth,
	hasCover,
	isOverlapping,
}: {
	avatarSize: AvatarSize;
	ringWidth: number;
	hasCover: boolean;
	isOverlapping?: boolean;
}): number {
	if (!hasCover || isOverlapping === false) return 0;
	return -(AVATAR_SIZE_POINTS[avatarSize] / 2 + ringWidth);
}

/**
 * The cover's drawn height: its content height plus the top inset it extends
 * under, in `page` only.
 *
 * A card sits inside a list and never reaches the status bar, so it never grows.
 * Negative inputs are clamped to nothing. A worklet, because inside a `Screen`
 * the inset is the scrollable's top spacer, which lives on the UI thread.
 */
export function resolvePageHeaderCoverHeight({
	variant,
	height,
	topInset,
	isInsetAware,
}: {
	variant: PageHeaderVariant;
	height: number;
	topInset: number;
	isInsetAware: boolean;
}): number {
	"worklet";
	const content = Math.max(0, height);
	if (variant !== "page" || !isInsetAware) return content;
	return content + Math.max(0, topInset);
}

/**
 * The cover's top margin, in points: negative to pull it up under a `Screen`
 * scrollable's top spacer.
 *
 * Every `Screen` scrollable opens with a spacer as tall as the navbar it must
 * clear — or the safe-area inset with no navbar. A page cover pulls itself up
 * by exactly that much (and {@link resolvePageHeaderCoverHeight} grows it by the
 * same) so the picture runs under the status bar and an overlay navbar with no
 * gap. Outside a `Screen` there is no spacer to pull under: the cover starts
 * where it is placed and only grows. A worklet, for the same reason.
 */
export function resolvePageHeaderCoverOffset({
	variant,
	isInsetAware,
	isInScreen,
	topInset,
}: {
	variant: PageHeaderVariant;
	isInsetAware: boolean;
	isInScreen: boolean;
	topInset: number;
}): number {
	"worklet";
	if (variant !== "page" || !isInsetAware || !isInScreen) return 0;
	return -Math.max(0, topInset);
}

/**
 * Top padding a coverless page header adds so its avatar never sits under the
 * status bar.
 *
 * Only outside a `Screen`: inside one the scrollable's top spacer already clears
 * the status bar or the navbar, and padding again would leave a gap. A cover
 * clears it by growing, and a card never reaches it.
 */
export function resolvePageHeaderTopPadding({
	variant,
	hasCover,
	isInScreen,
	safeAreaTop,
}: {
	variant: PageHeaderVariant;
	hasCover: boolean;
	isInScreen: boolean;
	safeAreaTop: number;
}): number {
	if (variant !== "page" || hasCover || isInScreen) return 0;
	return Math.max(0, safeAreaTop);
}

/** The fill the avatar's ring is painted in — the ground the header sits on. */
export function resolvePageHeaderRing(variant: PageHeaderVariant): "bg-card" | "bg-background" {
	return variant === "card" ? "bg-card" : "bg-background";
}

export type PageHeaderVariantProps = VariantProps<typeof pageHeaderVariants>;
