import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** What an attachment holds. Decides its glyph, its tone and how it is announced. */
export const ATTACHMENT_KINDS = ["image", "video", "audio", "file"] as const;

/** A composer pill, a square thumbnail, or a full-width row for a message. */
export const ATTACHMENT_LAYOUTS = ["chip", "tile", "card"] as const;

export const ATTACHMENT_SIZES = ["sm", "md", "lg"] as const;

/** The `type` of every `AttachmentStatus`, as a styling axis. */
/** Space between the attachments in an `Attachment.Group`. */
export const ATTACHMENT_GROUP_GAPS = ["sm", "md"] as const;

export const ATTACHMENT_STATUS_TYPES = ["idle", "uploading", "error", "done"] as const;

export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];
export type AttachmentLayout = (typeof ATTACHMENT_LAYOUTS)[number];
export type AttachmentSize = (typeof ATTACHMENT_SIZES)[number];
export type AttachmentGroupGap = (typeof ATTACHMENT_GROUP_GAPS)[number];
export type AttachmentStatusType = (typeof ATTACHMENT_STATUS_TYPES)[number];

/**
 * Where an upload stands. The app owns it; the attachment only draws it.
 *
 * Declared here rather than in `attachment.types.ts` so the pure resolvers can
 * read it without importing a file that names React Native types.
 */
export type AttachmentStatus =
	| { type: "idle" }
	/** `progress` is 0..1. Omitted, the bar is indeterminate. */
	| { type: "uploading"; progress?: number }
	| { type: "error"; message: string }
	| { type: "done" };

/**
 * The edge of each layout's preview square in points — or, for a tile, of the
 * tile itself.
 *
 * Fixed points rather than font-scaled, so a tray of mixed attachments lines up
 * whatever the reader's text size; the name and meta beside it still scale. A
 * test pins every entry to the `size-*` class that draws it.
 */
export const ATTACHMENT_SIZE_POINTS: Record<AttachmentLayout, Record<AttachmentSize, number>> = {
	chip: { sm: 32, md: 40, lg: 48 },
	tile: { sm: 80, md: 96, lg: 128 },
	card: { sm: 40, md: 48, lg: 56 },
};

/**
 * The tone each kind's fallback is painted in, as a surface and the foreground
 * drawn on it.
 *
 * Data rather than four branches: the preview reads the surface as a class (via
 * the `kind` axis below, which restates it literally for Tailwind's scanner) and
 * hands the foreground to the glyph as a token. A test pins every pair to tokens
 * both themes declare, and pins the classes to this map.
 */
export const ATTACHMENT_KIND_TONE: Record<AttachmentKind, { surface: string; foreground: string }> = {
	image: { surface: "info-soft", foreground: "info-soft-foreground" },
	video: { surface: "warning-soft", foreground: "warning-soft-foreground" },
	audio: { surface: "success-soft", foreground: "success-soft-foreground" },
	file: { surface: "secondary", foreground: "secondary-foreground" },
};

/**
 * The token a remove or retry glyph is drawn in, per layout.
 *
 * On a chip or a card the control is a hint beside the name, so it is muted. On
 * a tile it floats over a picture on a frosted `card` disc, so it takes the
 * full foreground to stay legible.
 */
export const ATTACHMENT_ACTION_FOREGROUND_TOKEN: Record<AttachmentLayout, string> = {
	chip: "muted-foreground",
	tile: "foreground",
	card: "muted-foreground",
};

/** The edge of a remove or retry control in points — `size-6`. */
export const ATTACHMENT_ACTION_EDGE = 24;

/** Slop on every side of a remove or retry control, growing its 24pt disc to a 44pt target. */
export const ATTACHMENT_ACTION_HIT_SLOP = 10;

/**
 * The one horizontal nudge an attachment gives on entering `error`: out by
 * `distance`, back past centre, home — three `stepMs` legs. Decoration, so it
 * stills under calm motion.
 */
export const ATTACHMENT_ERROR_NUDGE = { distance: 4, stepMs: 60 } as const;

/** How long an item in `Attachment.Group` takes to fade in or out. */
export const ATTACHMENT_GROUP_FADE_MS = 180;

/**
 * Styling for every part of an attachment.
 *
 * One slotted `tv()` because the preview, content, name, meta, progress and
 * action parts each live in their own file and cannot import the root without
 * closing a cycle (AGENTS.md rule 3), yet all of them read `layout` and `size`.
 *
 * - **`press`** is the press target: everything but the actions. The remove
 *   and retry controls sit beside it, never inside it, so their taps cannot
 *   reach the root's `onPress`.
 * - **`preview`** is the square; **`previewFallback`** the kind's tinted
 *   ground painted under the picture, so a dead URL leaves a glyph.
 * - **`dim`** is the veil a tile draws while it uploads, holding the bar.
 * - **`progressClip`** is the chip's bar clipped to the chip's own corner, so
 *   the bar cannot hang past a curve a theme's `--radius` made wider than its
 *   inset. A layer of its own, holding nothing but the bar, because the chip
 *   root must not clip (below).
 * - **`badge`** is the play disc centred on a video's poster.
 * - **`group`** is `Attachment.Group`'s content row.
 *
 * Only the tile root clips. A chip or card clipping its own bounds would clip
 * the 44pt slop of its remove control on Android, where touches outside an
 * `overflow: hidden` parent never land; the picture inside a chip rounds itself
 * through `image` instead.
 */
export const attachmentVariants = tv({
	slots: {
		root: "relative",
		press: "",
		preview: "items-center justify-center",
		previewFallback: "absolute inset-0 items-center justify-center",
		glyph: "",
		image: "absolute inset-0",
		content: "",
		name: "font-sans font-medium text-foreground",
		meta: "font-sans text-muted-foreground",
		progress: "",
		progressClip: "absolute inset-0 overflow-hidden",
		progressTrack: "h-0.5",
		actions: "flex-row items-center gap-1",
		action: "size-6 items-center justify-center rounded-full",
		dim: "absolute inset-0 items-center justify-center bg-overlay",
		badge: "size-6 items-center justify-center rounded-full bg-card/85",
		group: "flex-row items-center",
	},
	variants: {
		layout: {
			chip: {
				root: "max-w-64 flex-row items-center gap-1 rounded-xl border border-border bg-card p-1 pr-2",
				press: "shrink grow flex-row items-center gap-2",
				preview: "rounded-lg",
				previewFallback: "rounded-lg",
				image: "rounded-lg",
				content: "shrink",
				progress: "absolute right-3 bottom-0 left-3",
				progressClip: "rounded-xl",
			},
			tile: {
				root: "items-center justify-center overflow-hidden rounded-xl bg-muted",
				press: "absolute inset-0 items-center justify-center",
				preview: "absolute inset-0",
				content: "absolute right-0 bottom-0 left-0 bg-card/85 px-1.5 py-1",
				name: "text-xs",
				meta: "text-xs",
				progress: "w-2/3",
				progressTrack: "h-1",
				actions: "absolute top-1 right-1",
				action: "bg-card/85",
			},
			card: {
				root: "w-full flex-row items-center gap-2 rounded-lg border border-border bg-card p-3",
				press: "flex-1 flex-row items-center gap-3",
				preview: "rounded-md",
				previewFallback: "rounded-md",
				image: "rounded-md",
				content: "flex-1 gap-0.5",
				progress: "mt-1.5",
			},
		},
		size: {
			sm: {},
			md: {},
			lg: {},
		},
		kind: {
			image: { previewFallback: "bg-info-soft" },
			video: { previewFallback: "bg-warning-soft" },
			audio: { previewFallback: "bg-success-soft" },
			file: { previewFallback: "bg-secondary" },
		},
		status: {
			idle: {},
			uploading: {},
			error: { meta: "text-destructive" },
			done: {},
		},
		gap: {
			sm: { group: "gap-2" },
			md: { group: "gap-3" },
		},
		isDisabled: {
			true: { root: "opacity-50" },
			false: {},
		},
	},
	compoundVariants: [
		{ layout: "chip", size: "sm", class: { root: "h-10", preview: "size-8", glyph: "size-icon-sm" } },
		{ layout: "chip", size: "md", class: { root: "h-12", preview: "size-10", glyph: "size-icon-md" } },
		{ layout: "chip", size: "lg", class: { root: "h-14", preview: "size-12", glyph: "size-icon-lg" } },
		{ layout: "tile", size: "sm", class: { root: "size-20", glyph: "size-icon-lg" } },
		{ layout: "tile", size: "md", class: { root: "size-24", glyph: "size-icon-xl" } },
		{ layout: "tile", size: "lg", class: { root: "size-32", glyph: "size-icon-2xl" } },
		{ layout: "card", size: "sm", class: { preview: "size-10", glyph: "size-icon-md" } },
		{ layout: "card", size: "md", class: { preview: "size-12", glyph: "size-icon-lg" } },
		{ layout: "card", size: "lg", class: { preview: "size-14", glyph: "size-icon-xl" } },
		{ layout: ["chip", "card"], size: "sm", class: { name: "text-xs", meta: "text-xs" } },
		{ layout: ["chip", "card"], size: "md", class: { name: "text-sm", meta: "text-xs" } },
		{ layout: ["chip", "card"], size: "lg", class: { name: "text-base", meta: "text-sm" } },
		{ layout: ["chip", "card"], status: "error", class: { root: "border-destructive" } },
		{ layout: "tile", status: "error", class: { root: "border-2 border-destructive" } },
	],
	defaultVariants: {
		layout: "chip",
		size: "md",
		kind: "file",
		status: "done",
		gap: "sm",
		isDisabled: false,
	},
});

export type AttachmentVariantProps = VariantProps<typeof attachmentVariants>;

/** Which of the default parts an attachment draws, given its status and handlers. */
export type AttachmentParts = {
	showsProgress: boolean;
	showsRetry: boolean;
	showsRemove: boolean;
};

/**
 * Which default parts an attachment draws.
 *
 * Progress only while uploading. Retry only in error, and only when the app
 * gave an `onRetry` — a retry control that does nothing is worse than none.
 * Remove whenever there is an `onRemove`, uploading included, where it cancels.
 */
export function resolveAttachmentParts({
	status,
	hasRemove,
	hasRetry,
}: {
	status: AttachmentStatus;
	hasRemove: boolean;
	hasRetry: boolean;
}): AttachmentParts {
	return {
		showsProgress: status.type === "uploading",
		showsRemove: hasRemove,
		showsRetry: status.type === "error" && hasRetry,
	};
}
