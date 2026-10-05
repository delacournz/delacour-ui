import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** The logical sides a drawer opens from. `start` and `end` follow the layout direction. */
export const DRAWER_SIDES = ["start", "end", "top", "bottom"] as const;
export type DrawerSide = (typeof DRAWER_SIDES)[number];

/** The physical screen edges a side resolves to — what the motion and the pan are measured against. */
export const DRAWER_EDGES = ["left", "right", "top", "bottom"] as const;
export type DrawerEdge = (typeof DRAWER_EDGES)[number];

/** The panel's extents, narrowest first. */
export const DRAWER_SIZES = ["sm", "md", "lg", "full"] as const;
export type DrawerSize = (typeof DRAWER_SIZES)[number];

/** What a released swipe does. */
export type DrawerRelease = "dismiss" | "restore";

/**
 * Each size as a fraction of the window along the panel's axis, capped.
 *
 * A fraction so a phone always keeps a strip of the app in view to tap away
 * on; a cap so a tablet's drawer stays a drawer and not a second screen.
 * `full` keeps a 6% strip and has no cap.
 */
export const DRAWER_SIZE_EXTENT = {
	sm: { fraction: 0.62, max: 280 },
	md: { fraction: 0.78, max: 320 },
	lg: { fraction: 0.88, max: 400 },
	full: { fraction: 0.94, max: Number.POSITIVE_INFINITY },
} as const satisfies Record<DrawerSize, { fraction: number; max: number }>;

/** A release past this fraction of the extent toward the edge dismisses. */
export const DRAWER_DISMISS_FRACTION = 0.4;

/** A release faster than this toward the edge dismisses from any distance, pt/s. */
export const DRAWER_FLING_VELOCITY = 800;

/** The asymptote a drag away from the edge approaches, in points. */
export const DRAWER_RUBBER_BAND = 40;

/**
 * Travel along the panel's axis before the pan claims the touch, in points.
 * Travel across it first fails the pan, so a vertical scroll in a start
 * drawer's body never moves the drawer.
 */
export const DRAWER_PAN_ACTIVE_OFFSET = 10;

/** The bounds on a release animation, ms — finite so an E2E settle wait ends. */
export const DRAWER_RELEASE_MS = { min: 80, max: 220 } as const;

/** The scrim's token — the foundation's, named here so the test can pin it. */
export const DRAWER_SCRIM_TOKEN = "overlay";

/** Slop around the header ✕ — a bare glyph has no capsule to bring it toward 44pt. */
export const DRAWER_CLOSE_HIT_SLOP = 8;

export const drawerVariants = tv({
	slots: {
		/** The foundation's scrim token. The fade is `Overlay.Scrim`'s own. */
		scrim: "bg-overlay",
		/**
		 * A window-sized frame the panel is positioned in, laid out left to
		 * right whatever the app's direction, so the panel's classes and its
		 * safe-area padding are physical — the same terms its motion and its pan
		 * are measured in. `inner` restores the app's direction for the content.
		 */
		positioner: "absolute inset-0",
		/**
		 * The panel. Docked flush to its edge with square corners there, and the
		 * card corner on the two corners facing the app. `popover` because a
		 * drawer is a layer over the app, as `Dialog` and `BottomSheet` are.
		 */
		content: "absolute overflow-hidden bg-popover",
		/** The column inside the safe-area padding, laid out in the app's direction. */
		inner: "flex-1",
		/** Title block and ✕ in a row; the ✕ sits at the trailing edge. */
		header: "flex-row items-start gap-3 px-5 pt-5 pb-3",
		/** The title and description column, taking the row's slack. */
		heading: "flex-1 gap-1",
		body: "flex-1",
		/** The body's padding, on the scroll content so it scrolls with it. */
		bodyContent: "gap-3 px-5 pb-5",
		/** `mt-auto` so it sits at the panel's end even when no body takes the slack. */
		footer: "mt-auto flex-row items-center justify-end gap-2 border-border border-t px-5 py-4",
		close: "shrink-0",
	},
	variants: {
		edge: {
			left: { content: "inset-y-0 left-0 rounded-r-lg" },
			right: { content: "inset-y-0 right-0 rounded-l-lg" },
			top: { content: "inset-x-0 top-0 rounded-b-lg" },
			bottom: { content: "inset-x-0 bottom-0 rounded-t-lg" },
		},
	},
	defaultVariants: {
		edge: "left",
	},
});

/**
 * There is no `title` or `description` slot. Both *are* text presets with no
 * layout of their own — the ✕ sits in the flow, so the title needs no
 * clearance — and `tv` emits `undefined` for an empty class string. The parts
 * merge a caller's `className` with `cn()` instead, as `Dialog`'s description does.
 */
export type DrawerVariantProps = VariantProps<typeof drawerVariants>;

/**
 * The physical edge a side docks to. `start` is the left edge in a
 * left-to-right layout and the right edge in a right-to-left one.
 */
export function resolveDrawerEdge(side: DrawerSide, isRTL: boolean): DrawerEdge {
	if (side === "start") return isRTL ? "right" : "left";
	if (side === "end") return isRTL ? "left" : "right";
	return side;
}

/**
 * The panel's width (a left or right edge) or height (top or bottom), from the
 * window's extent along the same axis. Whole points, never negative.
 */
export function resolveDrawerExtent(size: DrawerSize, windowExtent: number): number {
	if (windowExtent <= 0) return 0;
	const { fraction, max } = DRAWER_SIZE_EXTENT[size];
	return Math.round(Math.min(windowExtent * fraction, max));
}

/**
 * The translate that puts the panel `progress` of the way in: 0 is the whole
 * extent off its edge, 1 is docked.
 *
 * A worklet, read in the panel's animated style. Flat on purpose — a
 * module-scope worklet never calls another function.
 */
export function resolveDrawerOffset(
	edge: DrawerEdge,
	extent: number,
	progress: number
): { translateX: number; translateY: number } {
	"worklet";
	const hidden = extent * (1 - progress);
	if (edge === "left") return { translateX: -hidden, translateY: 0 };
	if (edge === "right") return { translateX: hidden, translateY: 0 };
	if (edge === "top") return { translateX: 0, translateY: -hidden };
	return { translateX: 0, translateY: hidden };
}

/**
 * Where the panel sits for a finger's travel along its axis.
 *
 * Toward the docked edge — the way it would leave — the panel follows the
 * finger one to one. Away from it, into the app, it rubber-bands toward
 * `DRAWER_RUBBER_BAND` and never reaches it, so the panel gives a little and
 * says it goes no further. The result has the translation's sign.
 */
export function resolveDrawerDrag(edge: DrawerEdge, translation: number): number {
	"worklet";
	const sign = edge === "left" || edge === "top" ? -1 : 1;
	const toward = translation * sign;
	if (toward >= 0) return translation;
	const away = -toward;
	return -sign * (away / (1 + away / DRAWER_RUBBER_BAND));
}

/** How much of the extent a drag has carried the panel toward its edge, 0 to 1. */
export function resolveDrawerDragFraction(edge: DrawerEdge, translation: number, extent: number): number {
	"worklet";
	if (extent <= 0) return 0;
	const sign = edge === "left" || edge === "top" ? -1 : 1;
	return Math.min(1, Math.max(0, (translation * sign) / extent));
}

export type DrawerReleaseInput = {
	edge: DrawerEdge;
	/** The finger's travel along the panel's axis, physical sign. */
	translation: number;
	/** The release velocity along the same axis, pt/s, physical sign. */
	velocity: number;
	extent: number;
};

/**
 * Whether a released swipe dismisses the drawer or puts it back.
 *
 * A fling away from the edge always restores — the user changed their mind
 * mid-swipe. Otherwise a fling toward the edge faster than
 * `DRAWER_FLING_VELOCITY`, or a drag past `DRAWER_DISMISS_FRACTION` of the
 * extent, dismisses.
 */
export function resolveDrawerRelease({ edge, translation, velocity, extent }: DrawerReleaseInput): DrawerRelease {
	"worklet";
	if (extent <= 0) return "restore";
	const sign = edge === "left" || edge === "top" ? -1 : 1;
	const toward = velocity * sign;
	if (toward < -DRAWER_FLING_VELOCITY) return "restore";
	if (toward > DRAWER_FLING_VELOCITY) return "dismiss";
	return (translation * sign) / extent > DRAWER_DISMISS_FRACTION ? "dismiss" : "restore";
}

/**
 * How long the panel takes to cover the rest of its way out after a dismissing
 * release: the remaining distance at the release speed, held inside
 * `DRAWER_RELEASE_MS` so a flick does not snap and a slow release does not drift.
 */
export function resolveDrawerExitDuration({ remaining, velocity }: { remaining: number; velocity: number }): number {
	"worklet";
	const speed = Math.abs(velocity);
	if (remaining <= 0) return DRAWER_RELEASE_MS.min;
	if (speed === 0) return DRAWER_RELEASE_MS.max;
	return Math.min(DRAWER_RELEASE_MS.max, Math.max(DRAWER_RELEASE_MS.min, (remaining / speed) * 1000));
}

export type DrawerInsets = { top: number; right: number; bottom: number; left: number };

/**
 * The safe-area padding a panel docked to `edge` takes.
 *
 * Every side that meets a screen edge pads its inset — the docked side and the
 * two beside it — so a start drawer clears the status bar and the home
 * indicator. The side facing the app sits nowhere near a screen edge, and pads
 * nothing.
 */
export function resolveDrawerInsets(edge: DrawerEdge, insets: DrawerInsets): DrawerInsets {
	return {
		top: edge === "bottom" ? 0 : insets.top,
		right: edge === "left" ? 0 : insets.right,
		bottom: edge === "top" ? 0 : insets.bottom,
		left: edge === "right" ? 0 : insets.left,
	};
}

/**
 * The panel's full width or height: the size's extent plus the inset on the
 * docked edge.
 *
 * The size measures the content, not the safe-area band it sits under — a
 * top drawer at `sm` would otherwise hand a third of its 280pt to the status
 * bar and clip its rows. The motion uses this, so the panel starts fully off
 * screen.
 */
export function resolveDrawerFrameExtent(edge: DrawerEdge, extent: number, insets: DrawerInsets): number {
	return extent + insets[edge];
}
