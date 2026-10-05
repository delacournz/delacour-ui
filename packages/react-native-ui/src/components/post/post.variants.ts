import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { AvatarSize } from "../avatar/avatar.variants";

export const POST_VARIANTS = ["feed", "vote", "compact", "media"] as const;
export const POST_SIZES = ["default", "sm"] as const;
export const POST_STAT_TONES = ["neutral", "like", "save", "repost"] as const;
export const POST_MEDIA_SCRIMS = ["none", "top", "bottom", "both"] as const;

export type PostVariant = (typeof POST_VARIANTS)[number];
export type PostSize = (typeof POST_SIZES)[number];
export type PostStatTone = (typeof POST_STAT_TONES)[number];
export type PostMediaScrim = (typeof POST_MEDIA_SCRIMS)[number];
/** The caller's vote: up, down, or none cast. */
export type PostVote = "up" | "down" | null;
/** Which way a count moved — the direction its roll animates. */
export type PostStatDirection = "up" | "down" | "none";

/**
 * Filled outlines of the Central glyphs a stat lights up — the heart and the
 * bookmark — copied from the glyphs' own path data at the same 24-unit view box.
 *
 * Central Icons is an outlined set: no glyph in it is filled, and `CentralIconBase`
 * pins `fill="none"` on its `Svg` after the caller's props, so no prop reaches the
 * inside. `Post.Stat` therefore draws this path filled *under* the outline glyph,
 * which is what makes a lit heart the same shape as an unlit one rather than a
 * second icon swapped in. A glyph without an entry here lights by colour alone;
 * `Post.Stat`'s `fillPath` teaches it any other.
 */
export const POST_FILL_PATHS = {
	heart:
		"M21.25 9.9375C21.25 15.8672 12.7708 20.25 12 20.25C11.2292 20.25 2.75 15.8672 2.75 9.9375C2.75 5.8125 5.31944 3.75 7.88889 3.75C10.4583 3.75 12 5.29688 12 5.29688C12 5.29688 13.5417 3.75 16.1111 3.75C18.6806 3.75 21.25 5.8125 21.25 9.9375Z",
	bookmark:
		"M19.25 20.2515V3.75C19.25 3.19772 18.8023 2.75 18.25 2.75H5.75C5.19772 2.75 4.75 3.19771 4.75 3.75V20.2515C4.75 21.0522 5.64414 21.5281 6.30839 21.081L11.4416 17.6259C11.7792 17.3986 12.2208 17.3986 12.5584 17.6259L17.6916 21.081C18.3559 21.5282 19.25 21.0522 19.25 20.2515Z",
} as const;

/**
 * How far a 32-point control's touch area reaches past its edge — to 44, the
 * smallest target a fingertip hits reliably, without growing the row it sits in.
 */
export const POST_HIT_SLOP = 6;

/** The edge a 32-point control reaches with {@link POST_HIT_SLOP}. */
export const POST_CONTROL_POINTS = 32;

/**
 * The colour of type and glyphs laid over the picture in `media`. A literal,
 * deliberately: a photograph has no theme surface to take a foreground from,
 * and the scrim under it is what guarantees the contrast.
 */
export const POST_ON_MEDIA_COLOR = "#ffffff";

/** The darkest stop of a media scrim. The scrim is static black under white type, in both themes. */
export const POST_SCRIM_COLOR = "rgba(0, 0, 0, 0.55)";

/** What a variant decides about layout — never which parts exist. */
export type PostLayout = {
	/** Whether `Post.Media` renders at all. `compact` is a timeline row: no picture. */
	hasMedia: boolean;
	/** Whether the handle sits on the name's line rather than under it. */
	handleInline: boolean;
	/** The scrim `Post.Media` draws when the caller names none. */
	mediaScrimDefault: PostMediaScrim;
	/** Whether the header is laid over the picture. */
	authorOverMedia: boolean;
};

const POST_LAYOUTS: Record<PostVariant, PostLayout> = {
	feed: { hasMedia: true, handleInline: false, mediaScrimDefault: "none", authorOverMedia: false },
	vote: { hasMedia: true, handleInline: false, mediaScrimDefault: "none", authorOverMedia: false },
	compact: { hasMedia: false, handleInline: true, mediaScrimDefault: "none", authorOverMedia: false },
	media: { hasMedia: true, handleInline: false, mediaScrimDefault: "top", authorOverMedia: true },
};

/**
 * The layout a variant implies. Changing a post's shape is a prop change because
 * this is the only place a shape is described — the parts read it rather than
 * the caller restructuring the tree.
 */
export function resolvePostLayout(variant: PostVariant): PostLayout {
	return POST_LAYOUTS[variant];
}

/**
 * The scrim a `Post.Media` draws: the caller's, else the variant's default.
 * Only `media` defaults to one — it is the variant whose white author sits on
 * the photograph.
 */
export function resolveMediaScrim(variant: PostVariant, scrim?: PostMediaScrim): PostMediaScrim {
	return scrim ?? POST_LAYOUTS[variant].mediaScrimDefault;
}

/** Which edges of the picture a scrim darkens. */
export function resolveScrimStops(scrim: PostMediaScrim): { top: boolean; bottom: boolean } {
	return { top: scrim === "top" || scrim === "both", bottom: scrim === "bottom" || scrim === "both" };
}

/**
 * The vote a press casts. Pressing the arrow already cast clears it (reports
 * `null`); pressing the other one switches.
 */
export function resolveNextVote(current: PostVote, pressed: "up" | "down"): PostVote {
	return current === pressed ? null : pressed;
}

/**
 * Which way a count moved, for the direction its number rolls.
 *
 * Only two finite numbers have a direction. A string (`"Save"`), a first value
 * with nothing before it, and NaN all cross-fade instead — a roll in a guessed
 * direction is worse than none.
 */
export function resolveStatDirection(
	prev: number | string | undefined,
	next: number | string | undefined
): PostStatDirection {
	if (typeof prev !== "number" || typeof next !== "number") return "none";
	if (!Number.isFinite(prev) || !Number.isFinite(next)) return "none";
	if (next > prev) return "up";
	if (next < prev) return "down";
	return "none";
}

/**
 * The theme token a stat's glyph is painted with. Unlit is always muted, so a
 * row of stats reads as one quiet line until one is on.
 */
export function resolveStatTone(tone: PostStatTone, active: boolean): string {
	if (!active) return "muted-foreground";
	switch (tone) {
		case "like":
			return "destructive";
		case "save":
			return "primary";
		case "repost":
			return "success";
		default:
			return "foreground";
	}
}

/** The token a vote arrow and the score are painted with — the pill's own foreground. */
export function resolveVoteTone(vote: PostVote): string {
	if (vote === "up") return "warning-soft-foreground";
	if (vote === "down") return "info-soft-foreground";
	return "muted-foreground";
}

/** The face size an author or community avatar takes. `compact` is a timeline row: always the small face. */
export function resolvePostAvatarSize(size: PostSize, variant: PostVariant): AvatarSize {
	if (variant === "compact") return "sm";
	return size === "sm" ? "sm" : "md";
}

/**
 * The filled outline a stat draws under its glyph when it is lit.
 *
 * `like` fills the heart and `save` the bookmark — the glyphs those tones are
 * drawn with in every demo. A caller's `fillPath` wins, and an empty string opts
 * a tone out, for a `like` drawn with a glyph that is not the heart: a heart
 * filled under a thumb would show through it.
 */
export function resolveStatFillPath(tone: PostStatTone, fillPath?: string): string | undefined {
	if (fillPath !== undefined) return fillPath === "" ? undefined : fillPath;
	if (tone === "like") return POST_FILL_PATHS.heart;
	if (tone === "save") return POST_FILL_PATHS.bookmark;
	return undefined;
}

/** The `vote` axis' key for a cast vote. `tv` cannot key a variant on `null`. */
export function resolveVoteKey(vote: PostVote): "up" | "down" | "none" {
	return vote ?? "none";
}

/**
 * Styling for every part of a post.
 *
 * `variant` decides padding, the media's shape and where the author sits;
 * `size` steps type and gaps; `tone` × `active` paints a stat; `vote` tints the
 * score pill. `align` pushes a stat, and every one after it, to the trailing
 * edge with `ml-auto`.
 *
 * The card is a hand-rolled `bg-card border border-border rounded-lg` rather
 * than a `Card`: a post owns its own padding model (the media in `media` is
 * full-bleed), and a `Card` inside would bring a second one.
 *
 * `media` puts the header `absolute` over the picture, with `text-white` on the
 * author. That is the one raw colour here and it is deliberate — type on a
 * photograph has no theme surface to take a foreground from, and the scrim
 * under it is what guarantees the contrast. Nothing else names a raw colour or
 * a `dark:` variant.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const postVariants = tv({
	slots: {
		root: "w-full",
		header: "flex-row items-center gap-3",
		author: "min-w-0 flex-1 flex-row items-center gap-2.5",
		authorText: "min-w-0 flex-1",
		authorLine: "min-w-0 flex-row items-center gap-1",
		authorName: "shrink font-semibold",
		authorHandle: "shrink",
		authorMeta: "",
		authorVerified: "size-icon-xs",
		community: "min-w-0 flex-1 flex-row items-center gap-2.5",
		communityName: "font-semibold text-foreground",
		action: "size-8 items-center justify-center rounded-full",
		actionIcon: "size-icon-sm",
		title: "font-semibold text-foreground",
		bodyFrame: "",
		body: "text-foreground",
		bodyMeasure: "absolute inset-x-0 top-0 opacity-0",
		bodyTag: "text-info",
		bodyToggle: "font-medium text-muted-foreground",
		media: "w-full overflow-hidden bg-muted",
		mediaPress: "absolute inset-0",
		mediaImage: "absolute inset-0 h-full w-full",
		mediaFallback: "absolute inset-0 items-center justify-center",
		mediaFallbackIcon: "size-icon-xl",
		mediaScrim: "absolute inset-x-0 h-28",
		footer: "flex-row items-center gap-1",
		stat: "min-h-8 flex-row items-center gap-1.5 rounded-full px-1.5",
		statIcon: "",
		statFill: "absolute inset-0",
		statCount: "overflow-hidden",
		statValue: "tabular-nums",
		votes: "flex-row items-center self-start rounded-full",
		voteArrow: "size-8 items-center justify-center rounded-full",
		voteIcon: "",
		voteScore: "min-w-6 text-center font-semibold tabular-nums",
	},
	variants: {
		variant: {
			feed: { root: "gap-3 rounded-lg border border-border bg-card px-4 py-4", media: "rounded-xl" },
			vote: { root: "gap-3 rounded-lg border border-border bg-card px-4 py-4", media: "rounded-xl" },
			compact: { root: "gap-2 rounded-lg border border-border bg-card px-4 py-3", media: "hidden" },
			media: {
				root: "gap-3 overflow-hidden rounded-lg bg-card pb-4",
				header: "absolute inset-x-0 top-0 z-10 px-4 pt-3",
				authorName: "text-white",
				authorHandle: "text-white/80",
				authorMeta: "text-white/80",
				communityName: "text-white",
				title: "px-4",
				body: "px-4",
				bodyToggle: "px-4",
				footer: "px-3",
			},
		},
		size: {
			default: {
				authorName: "text-sm",
				authorHandle: "text-sm",
				authorMeta: "text-sm",
				communityName: "text-sm",
				title: "text-lg",
				body: "text-base",
				bodyToggle: "text-base",
				statIcon: "size-icon-sm",
				statValue: "text-sm",
				voteIcon: "size-icon-sm",
				voteScore: "text-sm",
			},
			sm: {
				root: "gap-2",
				authorName: "text-xs",
				authorHandle: "text-xs",
				authorMeta: "text-xs",
				communityName: "text-xs",
				title: "text-base",
				body: "text-sm",
				bodyToggle: "text-sm",
				statIcon: "size-icon-xs",
				statValue: "text-xs",
				voteIcon: "size-icon-xs",
				voteScore: "text-xs",
			},
		},
		tone: {
			neutral: {},
			like: {},
			save: {},
			repost: {},
		},
		// The empty `false` branches type the props as `boolean` rather than
		// `true`. See the note in button.variants.ts.
		active: { true: {}, false: { statValue: "text-muted-foreground" } },
		align: { start: {}, end: { stat: "ml-auto" } },
		vote: {
			none: { votes: "bg-muted", voteScore: "text-foreground" },
			up: { votes: "bg-warning-soft", voteScore: "text-warning-soft-foreground" },
			down: { votes: "bg-info-soft", voteScore: "text-info-soft-foreground" },
		},
		isDisabled: { true: { root: "opacity-50", votes: "opacity-50" }, false: {} },
	},
	compoundVariants: [
		{ variant: ["feed", "vote", "compact"], size: "sm", class: { root: "rounded-md px-3" } },
		{ variant: "compact", class: { title: "text-base", body: "text-sm" } },
		{
			variant: ["feed", "vote", "compact"],
			class: {
				authorHandle: "text-muted-foreground",
				authorMeta: "text-muted-foreground",
				authorName: "text-foreground",
			},
		},
		{ active: true, tone: "neutral", class: { statValue: "text-foreground" } },
		{ active: true, tone: "like", class: { statValue: "text-destructive" } },
		{ active: true, tone: "save", class: { statValue: "text-primary" } },
		{ active: true, tone: "repost", class: { statValue: "text-success" } },
	],
	defaultVariants: {
		variant: "feed",
		size: "default",
		tone: "neutral",
		active: false,
		align: "start",
		vote: "none",
		isDisabled: false,
	},
});

export type PostVariantProps = VariantProps<typeof postVariants>;
