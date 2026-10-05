import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import { ALERT_FOREGROUND_TOKEN, ALERT_STATUSES, type AlertStatus } from "../alert/alert.variants";
import type { HapticFeedback } from "../pressable/pressable";

/** Alert's statuses, the same tuple — a toast and an alert saying the same thing look like one family. */
export const TOAST_STATUSES = ALERT_STATUSES;

/** Alert's glyph and title colour per status — the same map, so the two cannot drift. */
export const TOAST_FOREGROUND_TOKEN = ALERT_FOREGROUND_TOKEN;

export const TOAST_PLACEMENTS = ["top", "bottom"] as const;

type Status = AlertStatus;
type Placement = (typeof TOAST_PLACEMENTS)[number];

/**
 * How long a toast stays, in milliseconds.
 *
 * An action buys two more seconds, because reading and then reaching for a
 * button takes longer than reading. Under a screen reader nothing timed leaves
 * sooner than ten seconds: a message has to be read out in full before it goes
 * (WCAG 2.2.1, timing adjustable).
 */
export const TOAST_DURATION = {
	default: 4000,
	withAction: 6000,
	screenReaderMinimum: 10_000,
} as const;

/** How the stack recedes: three drawn, each older one 8pt toward the edge, 5% smaller and 25% fainter. */
export const TOAST_STACK = {
	maxVisible: 3,
	depthOffset: 8,
	depthScale: 0.05,
	depthOpacity: 0.25,
} as const;

/** How far a toast travels in from its edge, in points, while it fades in. */
export const TOAST_ENTER_DISTANCE = 16;

/** The gap between entrances when several toasts are shown in one tick. */
export const TOAST_STAGGER_MS = 220;

/** What turns a drag into a dismissal: 40% of the toast's own extent, or a fling over 800pt/s. */
export const TOAST_SWIPE = {
	distanceRatio: 0.4,
	velocity: 800,
} as const;

/** The furthest a toast follows a drag toward the centre, in points. */
export const TOAST_RUBBER_BAND = 24;

/**
 * Styling for every part of a toast, and for the viewport that stacks them.
 *
 * The card is a `popover` surface with the card corner and a hairline — no
 * shadow, like every surface here; the hairline is its edge over the app.
 * `max-w-[560px]` keeps it a toast on a tablet, centred by the `item` slot
 * that positions it.
 *
 * `items-start`, with the indicator as tall as the title's line, so the glyph
 * stays level with the first line however far the description wraps; the
 * action and the close control centre themselves on the whole card.
 *
 * The title takes Alert's foreground token for its status — written out, not
 * built from the map, because Tailwind's scanner is static. A test pins each
 * class to `ALERT_FOREGROUND_TOKEN`. The root holds no `text-*` (rule 1).
 *
 * Free of React Native imports so it stays unit-testable.
 */
export const toastVariants = tv({
	slots: {
		viewport: "absolute inset-0",
		stack: "absolute inset-0",
		item: "absolute inset-x-0 items-center px-3",
		root: "w-full max-w-[560px] flex-row items-start gap-3 rounded-lg border border-border bg-popover px-4 py-3",
		indicator: "h-5 items-center justify-center",
		content: "min-w-0 flex-1 gap-0.5",
		title: "font-semibold text-sm",
		description: "text-muted-foreground text-sm",
		action: "-my-1 h-8 items-center justify-center self-center rounded-md px-2",
		actionLabel: "font-semibold text-primary text-sm",
		close: "size-5 items-center justify-center self-center rounded-full",
		/** Edge length an `Icon` composed into the toast inherits. */
		icon: "size-icon-md",
	},
	variants: {
		status: {
			default: { title: "text-foreground" },
			info: { title: "text-info-soft-foreground" },
			success: { title: "text-success-soft-foreground" },
			warning: { title: "text-warning-soft-foreground" },
			destructive: { title: "text-destructive-soft-foreground" },
		},
	},
	defaultVariants: {
		status: "default",
	},
});

export type ToastVariantProps = VariantProps<typeof toastVariants>;

/**
 * How long a toast stays, in ms; `0` stays until hidden.
 *
 * An explicit, sane `duration` wins. Without one a loading toast stays until
 * it is updated, one with an action gets 6000 and anything else 4000. Under a
 * screen reader a timed toast is stretched to at least 10000.
 */
export function resolveToastDuration(
	options: { duration?: number; hasAction?: boolean; isLoading?: boolean },
	{ isScreenReaderEnabled }: { isScreenReaderEnabled: boolean }
): number {
	const { duration } = options;
	let resolved: number;
	if (duration !== undefined && Number.isFinite(duration) && duration >= 0) resolved = duration;
	else if (duration === undefined && options.isLoading) resolved = 0;
	else resolved = options.hasAction ? TOAST_DURATION.withAction : TOAST_DURATION.default;

	if (resolved === 0) return 0;
	return isScreenReaderEnabled ? Math.max(resolved, TOAST_DURATION.screenReaderMinimum) : resolved;
}

/** What `resolveToastStack` reads from each toast. */
export type ToastStackInput = { id: string; placement: Placement; isExiting: boolean };

/** One toast's place in its stack. */
export type ToastStackEntry = {
	id: string;
	/** 0 is the front. An exiting toast keeps the depth it is leaving from. */
	depth: number;
	/** Drawn. A toast past the third is queued until one in front leaves. */
	isVisible: boolean;
	isExiting: boolean;
};

/**
 * One placement's stack, newest first.
 *
 * Depth counts only the toasts that are staying, so the moment one is hidden
 * the toasts behind it move up and the next queued toast is drawn — while the
 * hidden one is still animating out, at the depth it left. A toast that was
 * queued when it was hidden was never drawn and is not drawn leaving.
 */
export function resolveToastStack(items: readonly ToastStackInput[], placement: Placement): ToastStackEntry[] {
	const entries: ToastStackEntry[] = [];
	let staying = 0;
	for (let index = items.length - 1; index >= 0; index--) {
		const item = items[index] as ToastStackInput;
		if (item.placement !== placement) continue;
		const isVisible = staying < TOAST_STACK.maxVisible;
		entries.push({ id: item.id, depth: staying, isVisible, isExiting: item.isExiting });
		if (!item.isExiting) staying += 1;
	}
	return entries;
}

/**
 * The transform a toast at `depth` takes: further toward its entry edge,
 * smaller and fainter. Linear in `depth`, so an animated depth moves smoothly
 * between steps.
 */
export function resolveToastDepthStyle(
	depth: number,
	placement: Placement
): { translateY: number; scale: number; opacity: number } {
	"worklet";
	const towardEdge = placement === "bottom" ? 1 : -1;
	return {
		translateY: towardEdge * TOAST_STACK.depthOffset * depth,
		scale: 1 - TOAST_STACK.depthScale * depth,
		opacity: 1 - TOAST_STACK.depthOpacity * depth,
	};
}

/**
 * How tall a toast is drawn at `depth`, or `null` to leave it at its own height.
 *
 * A toast behind takes the front toast's height. Scaled about the entry edge,
 * a taller one would otherwise rise past the front card and show its title
 * over it. Between depth 0 and 1 the height eases from the front's to its own,
 * so a toast moving up grows into place rather than jumping.
 */
export function resolveToastStackedHeight({
	depth,
	natural,
	front,
}: {
	depth: number;
	natural: number;
	front: number;
}): number | null {
	"worklet";
	if (natural <= 0 || front <= 0) return null;
	const t = Math.min(1, Math.max(0, depth));
	return natural + (front - natural) * t;
}

/**
 * How long a toast waits before entering, so several shown in one tick
 * arrive one after another. Counted from when it was shown, so a toast that
 * sat in the queue enters as soon as it is drawn.
 */
export function resolveToastEnterDelay({
	createdAt,
	batchIndex,
	now,
}: {
	createdAt: number;
	batchIndex: number;
	now: number;
}): number {
	return Math.max(0, createdAt + batchIndex * TOAST_STAGGER_MS - now);
}

function rubberBand(distance: number): number {
	"worklet";
	const magnitude = Math.abs(distance);
	return Math.sign(distance) * ((magnitude * TOAST_RUBBER_BAND) / (magnitude + TOAST_RUBBER_BAND));
}

type ToastDragInput = { placement: Placement; translationX: number; translationY: number };

/**
 * Where a dragged toast is drawn. Sideways and toward its entry edge it
 * follows the finger; toward the centre it resists and never goes further than
 * `TOAST_RUBBER_BAND`, which says "not this way" without a word.
 */
export function resolveToastDrag({ placement, translationX, translationY }: ToastDragInput): {
	x: number;
	y: number;
} {
	"worklet";
	const towardEdge = placement === "bottom" ? 1 : -1;
	const y = translationY * towardEdge >= 0 ? translationY : rubberBand(translationY);
	return { x: translationX, y };
}

export type ToastRelease = { kind: "settle" } | { kind: "dismiss"; axis: "x" | "y"; direction: 1 | -1 };

/**
 * What a released drag does.
 *
 * Sideways past 40% of the toast's width, or toward its entry edge past 40%
 * of its height, dismisses — and so does a fling over 800pt/s either way.
 * Toward the centre never dismisses: that is not where a toast goes. When both
 * axes qualify, the one the finger travelled further along wins.
 */
export function resolveToastRelease({
	placement,
	translationX,
	translationY,
	velocityX,
	velocityY,
	width,
	height,
}: ToastDragInput & { velocityX: number; velocityY: number; width: number; height: number }): ToastRelease {
	"worklet";
	const towardEdge = placement === "bottom" ? 1 : -1;

	let sideways: ToastRelease = { kind: "settle" };
	if (Math.abs(velocityX) > TOAST_SWIPE.velocity) {
		sideways = { kind: "dismiss", axis: "x", direction: velocityX > 0 ? 1 : -1 };
	} else if (Math.abs(translationX) > width * TOAST_SWIPE.distanceRatio) {
		sideways = { kind: "dismiss", axis: "x", direction: translationX > 0 ? 1 : -1 };
	}

	const travel = translationY * towardEdge;
	const fling = velocityY * towardEdge;
	const isEdgeward = travel >= 0 && (fling > TOAST_SWIPE.velocity || travel > height * TOAST_SWIPE.distanceRatio);
	const edgeward: ToastRelease = isEdgeward
		? { kind: "dismiss", axis: "y", direction: towardEdge }
		: { kind: "settle" };

	if (sideways.kind === "dismiss" && edgeward.kind === "dismiss") {
		return Math.abs(translationX) >= Math.abs(translationY) ? sideways : edgeward;
	}
	return sideways.kind === "dismiss" ? sideways : edgeward;
}

/** The haptic a toast plays as it appears: the caller's, else the status's notification, else none. */
export function resolveToastHaptic(status: Status, haptic: HapticFeedback | false | undefined): HapticFeedback | false {
	if (haptic !== undefined) return haptic;
	if (status === "success") return "success";
	if (status === "warning") return "warning";
	if (status === "destructive") return "error";
	return false;
}

/** What a screen reader says as a toast appears: the title, then the description. */
export function resolveToastAnnouncement({ title, description }: { title: string; description?: string }): string {
	return description ? `${title}. ${description}` : title;
}

/** Whether the announcement cuts in over whatever is being read — a warning or a failure does. */
export function resolveToastInterrupts(status: Status): boolean {
	return status === "destructive" || status === "warning";
}

/** A failure is an `alert`; anything else is a plain group. */
export function resolveToastRole(status: Status): "alert" | "none" {
	return status === "destructive" ? "alert" : "none";
}
