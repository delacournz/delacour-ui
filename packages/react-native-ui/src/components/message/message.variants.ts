import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { MessageStatusType } from "./message.types";

/** Which side of the conversation the message is on. Alignment and fill follow it. */
export const MESSAGE_DIRECTIONS = ["incoming", "outgoing"] as const;

/**
 * Where a message sits in a run of consecutive messages from one sender.
 *
 * Restated, not shared, by `MessageScroller` — the two agree on this literal
 * union and neither imports the other.
 */
export const MESSAGE_POSITIONS = ["single", "first", "middle", "last"] as const;

/** How the bubble is filled. `plain` draws no fill at all — for emoji-only and system lines. */
export const MESSAGE_TONES = ["default", "accent", "plain"] as const;

/** A step on the type scale, with the bubble's padding stepping alongside it. */
export const MESSAGE_SIZES = ["sm", "md", "lg"] as const;

/** Where `Message.Reactions` sits: hung over the bubble's bottom edge, or in a row under it. */
export const MESSAGE_REACTION_PLACEMENTS = ["overlap", "below"] as const;

/** Every {@link MessageStatusType}, in the order a message moves through them. */
export const MESSAGE_STATUS_TYPES = [
	"sending",
	"sent",
	"delivered",
	"read",
	"failed",
] as const satisfies readonly MessageStatusType[];

export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];
export type MessagePosition = (typeof MESSAGE_POSITIONS)[number];
export type MessageTone = (typeof MESSAGE_TONES)[number];
export type MessageSize = (typeof MESSAGE_SIZES)[number];
export type MessageReactionPlacement = (typeof MESSAGE_REACTION_PLACEMENTS)[number];

/** A bubble corner: `lg` is the open `rounded-2xl`, `sm` the tight `rounded-md` where a run joins. */
export type MessageCornerStep = "lg" | "sm";

/** A bubble's four corners, in logical terms, so they mirror under RTL. */
export type MessageCorners = {
	topStart: MessageCornerStep;
	topEnd: MessageCornerStep;
	bottomStart: MessageCornerStep;
	bottomEnd: MessageCornerStep;
};

/**
 * The text token drawn on each bubble fill.
 *
 * `muted`'s pair is `foreground`, not `muted-foreground`: a muted bubble holds
 * body copy, and `muted-foreground` is the grey for secondary text beside it.
 * The test reads each bubble's fill and text classes back through this map.
 */
export const MESSAGE_FILL_FOREGROUND = {
	primary: "primary-foreground",
	muted: "foreground",
	secondary: "secondary-foreground",
	transparent: "foreground",
} as const;

/**
 * The theme token a receipt's glyph is painted with, per status.
 *
 * A glyph's colour reaches an SVG paint prop, so it is a token for
 * `useThemeColor` rather than a class; the `statusLabel` slot resolves the same
 * token as a class, and a test holds the two together.
 */
export const MESSAGE_STATUS_TOKEN: Record<MessageStatusType, string> = {
	sending: "muted-foreground",
	sent: "muted-foreground",
	delivered: "muted-foreground",
	read: "info",
	failed: "destructive",
};

/**
 * Which corners of a bubble are tight, from its side and its place in a run.
 *
 * A run stacks against the side its messages align to — the end for outgoing,
 * the start for incoming — and every corner on that side that faces a
 * neighbour steps down, so the stack reads as one shape with a seam rather than
 * as separate pills. The far side always stays open. `single` has no neighbours,
 * so nothing steps.
 */
export function resolveMessageCorners(direction: MessageDirection, position: MessagePosition): MessageCorners {
	const hasAbove = position === "middle" || position === "last";
	const hasBelow = position === "first" || position === "middle";
	const top: MessageCornerStep = hasAbove ? "sm" : "lg";
	const bottom: MessageCornerStep = hasBelow ? "sm" : "lg";

	return direction === "outgoing"
		? { topStart: "lg", topEnd: top, bottomStart: "lg", bottomEnd: bottom }
		: { topStart: top, topEnd: "lg", bottomStart: bottom, bottomEnd: "lg" };
}

const CORNER_CLASS: Record<keyof MessageCorners, string> = {
	topStart: "rounded-ss-md",
	topEnd: "rounded-se-md",
	bottomStart: "rounded-es-md",
	bottomEnd: "rounded-ee-md",
};

/**
 * The corner classes for a set of {@link MessageCorners}.
 *
 * The base `rounded-2xl` comes first and each tight corner after it, because
 * tailwind-merge drops a corner class that a later `rounded-*` covers but keeps
 * one written after it. The corners are logical (`ss`/`se`/`es`/`ee`): Uniwind
 * compiles them to `borderStartStartRadius` and friends, which React Native
 * flips under RTL with nothing else said.
 */
export function resolveMessageCornerClass(corners: MessageCorners): string {
	const keys = ["topStart", "topEnd", "bottomStart", "bottomEnd"] as const;
	return ["rounded-2xl", ...keys.filter((key) => corners[key] === "sm").map((key) => CORNER_CLASS[key])].join(" ");
}

/**
 * The gap below a message: tight inside a run, a breath after it.
 *
 * Expressed by the message rather than by the list, so a list needs no
 * separator logic — it computes `position` and the spacing falls out.
 */
export function resolveMessageSpacing(position: MessagePosition): string {
	return position === "first" || position === "middle" ? "mb-0.5" : "mb-2";
}

/**
 * Every styled part of a message, one slot each.
 *
 * Text colour lives on `text` and the label slots only — rule 1 — and the
 * bubble publishes `text` to its subtree, so a bare `<Text>` inside one picks
 * up the bubble's foreground.
 */
export const messageVariants = tv({
	slots: {
		root: "w-full flex-row items-end gap-2",
		column: "max-w-[80%] shrink gap-1",
		gutter: "w-8 shrink-0 items-center justify-end",
		bubble: "",
		text: "",
		header: "flex-row items-baseline gap-2 px-1",
		author: "font-semibold text-muted-foreground text-xs",
		timestamp: "text-muted-foreground text-xs",
		status: "flex-row items-center gap-1 px-1",
		statusLabel: "text-xs",
		retry: "font-semibold text-destructive text-xs",
		attachments: "gap-1 overflow-hidden rounded-xl",
		reactions: "z-10 flex-row flex-wrap gap-1 px-2",
		actions: "flex-row flex-wrap items-center gap-2 px-1",
		typing: "flex-row items-center gap-1 px-3.5 py-3",
		typingDot: "size-2 rounded-full bg-muted-foreground",
	},
	variants: {
		direction: {
			incoming: {
				root: "justify-start",
				column: "items-start",
				header: "justify-start",
				status: "justify-start",
				actions: "justify-start",
				bubble: "bg-muted",
				text: "text-foreground",
			},
			outgoing: {
				root: "justify-end",
				column: "items-end",
				header: "justify-end",
				status: "justify-end",
				actions: "justify-end",
				bubble: "bg-primary",
				text: "text-primary-foreground",
			},
		},
		tone: {
			default: {},
			accent: {},
			plain: { bubble: "bg-transparent p-0", text: "text-foreground" },
		},
		size: {
			sm: { bubble: "px-3 py-1.5", text: "text-sm" },
			md: { bubble: "px-3.5 py-2", text: "text-base" },
			lg: { bubble: "px-4 py-2.5", text: "text-lg" },
		},
		position: {
			single: { root: resolveMessageSpacing("single") },
			first: { root: resolveMessageSpacing("first") },
			middle: { root: resolveMessageSpacing("middle") },
			last: { root: resolveMessageSpacing("last") },
		},
		placement: {
			overlap: { reactions: "-mt-2" },
			below: { reactions: "" },
		},
		statusType: {
			sending: { statusLabel: "text-muted-foreground" },
			sent: { statusLabel: "text-muted-foreground" },
			delivered: { statusLabel: "text-muted-foreground" },
			read: { statusLabel: "text-info" },
			failed: { statusLabel: "text-destructive" },
		},
		isSelected: {
			true: { root: "bg-accent", bubble: "outline-2 outline-ring" },
			false: {},
		},
		isFailed: {
			true: { bubble: "border border-destructive" },
			false: {},
		},
		isSending: {
			true: { bubble: "opacity-70" },
			false: {},
		},
		isMedia: {
			true: { bubble: "overflow-hidden p-0" },
			false: {},
		},
	},
	compoundVariants: [
		{ direction: "incoming", tone: "accent", class: { bubble: "bg-secondary", text: "text-secondary-foreground" } },
		{ tone: "plain", class: { bubble: "bg-transparent p-0", text: "text-foreground" } },
		{ isMedia: true, class: { bubble: "p-0" } },
	],
	defaultVariants: {
		direction: "incoming",
		tone: "default",
		size: "md",
		position: "single",
		placement: "overlap",
		isSelected: false,
		isFailed: false,
		isSending: false,
		isMedia: false,
	},
});

export type MessageVariantProps = VariantProps<typeof messageVariants>;
