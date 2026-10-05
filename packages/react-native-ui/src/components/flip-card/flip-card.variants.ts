import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { SurfacePadding, SurfaceVariant } from "../surface/surface.variants";

export const FLIP_CARD_FACES = ["front", "back"] as const;
export type FlipCardFace = (typeof FLIP_CARD_FACES)[number];

export const FLIP_CARD_AXES = ["x", "y"] as const;
/** The axis the card turns about: `"y"` swings it left/right, `"x"` tips it top/bottom. */
export type FlipCardAxis = (typeof FLIP_CARD_AXES)[number];

export const FLIP_CARD_TRIGGERS = ["press", "swipe", "manual"] as const;
/** What turns the card: a tap anywhere on it, a drag that scrubs it, or only the app. */
export type FlipCardTrigger = (typeof FLIP_CARD_TRIGGERS)[number];

export const FLIP_CARD_MOTIONS = ["default", "snappy", "gentle"] as const;
export type FlipCardMotion = (typeof FLIP_CARD_MOTIONS)[number];

/**
 * The spring each `motion` preset settles on.
 *
 * Only the ordering is a contract — snappy stiffer than default stiffer than
 * gentle — and the test pins that rather than the numbers, so tuning a preset
 * is a one-line change that cannot reorder them by accident.
 */
export const FLIP_CARD_MOTION = {
	default: { damping: 18, stiffness: 160 },
	snappy: { damping: 22, stiffness: 260 },
	gentle: { damping: 16, stiffness: 90 },
} as const satisfies Record<FlipCardMotion, { damping: number; stiffness: number }>;

/** The scale the whole card dips to while a finger is down on a `trigger="press"` card. */
export const FLIP_CARD_PRESSED_SCALE = 0.98;

/** The spring that dip rides — `Pressable`'s, so the card presses like every other control. */
export const FLIP_CARD_PRESS_SPRING = { damping: 18, mass: 0.4, stiffness: 320 } as const;

/** How long calm motion's crossfade takes, in ms. */
export const FLIP_CARD_CALM_DURATION = 150;

/** The camera distance a card turns under when it names none, in points. */
export const FLIP_CARD_DEFAULT_PERSPECTIVE = 1000;

/**
 * Degrees per second past which a released swipe goes the way it was going,
 * however short of half way it stopped.
 */
export const FLIP_CARD_VELOCITY_THRESHOLD = 500;

/** The furthest a drag can pull the card past either rest, in degrees. */
export const FLIP_CARD_RUBBER_BAND = 40;

/**
 * Degrees past 90 the card has to travel before the crossing haptic plays.
 *
 * The root remembers the side it last ticked on as 0 or 180, so a finger
 * resting on the edge-on frame and jittering a degree either way does not buzz
 * on every frame.
 */
export const FLIP_CARD_HAPTIC_HYSTERESIS = 4;

/** What a screen reader offers in place of the gesture. */
export const FLIP_CARD_ACTION_LABEL = "Flip card";

export const FLIP_CARD_DEFAULT_FACE_LABELS = {
	front: "Front of card",
	back: "Back of card",
} as const satisfies Record<FlipCardFace, string>;

/**
 * Styling for a flip card.
 *
 * `container` stacks the card above anything passed to the root that is not a
 * face — a `FlipCard.Trigger` beneath it, say — so the back, which fills the
 * card, never covers it.
 *
 * `root` is the card itself, the footprint the caller sizes — `relative`, so the back can fill
 * it. The front is in flow and `grow`s, so it fills a footprint the caller
 * fixed (`h-48`, `aspect-[1.586]`) and sizes the card from its own content when
 * nothing did. The back is `absolute inset-0` over it: the front sets the size,
 * the back takes it.
 *
 * The faces themselves are `Surface`s, so the corner, the hairline and the fill
 * come from there — no shadow, the way nothing in this package casts one, and
 * the hairline is what holds the card's edge while it turns edge-on.
 *
 * `trigger` is a row; with no children it is a square on the button scale, so
 * the default glyph has a touch target and lines up with a `Button` beside it.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const flipCardVariants = tv({
	slots: {
		container: "gap-3",
		root: "relative",
		wrapper: "",
		surface: "grow",
		trigger: "flex-row items-center justify-center gap-2",
	},
	variants: {
		face: {
			front: { wrapper: "grow" },
			back: { wrapper: "absolute inset-0" },
		},
		isIconOnly: {
			true: { trigger: "size-button-md rounded-button-md" },
			false: {},
		},
	},
	defaultVariants: {
		face: "front",
		isIconOnly: false,
	},
});

export type FlipCardVariantProps = VariantProps<typeof flipCardVariants>;

/** The fill each face takes when it names none — the back steps down so the two read apart. */
export const FLIP_CARD_DEFAULT_VARIANTS = {
	front: "default",
	back: "secondary",
} as const satisfies Record<FlipCardFace, SurfaceVariant>;

/**
 * The classes, fill and padding one face renders with.
 *
 * `wrapper` is the animated view that turns; `surface` is the `Surface` inside
 * it, which takes the caller's `className`.
 */
export function resolveFlipCardClasses({
	face,
	variant,
	padding,
	className,
}: {
	face: FlipCardFace;
	variant?: SurfaceVariant;
	padding?: SurfacePadding;
	className?: string;
}): { wrapper: string; surface: string; variant: SurfaceVariant; padding: SurfacePadding } {
	const slots = flipCardVariants({ face });
	return {
		padding: padding ?? "md",
		surface: slots.surface({ className }),
		variant: variant ?? FLIP_CARD_DEFAULT_VARIANTS[face],
		wrapper: slots.wrapper(),
	};
}

/** The rest angle of a face: 0 for the front, 180 for the back. */
export function faceRotation(face: FlipCardFace): 0 | 180 {
	"worklet";
	return face === "front" ? 0 : 180;
}

/** The other face. */
export function oppositeFace(face: FlipCardFace): FlipCardFace {
	return face === "front" ? "back" : "front";
}

/** A rotation in degrees, folded into [0, 360). */
export function normalizeRotation(rotation: number): number {
	"worklet";
	const folded = ((rotation % 360) + 360) % 360;
	return folded === 0 ? 0 : folded;
}

/**
 * Which face is showing at an angle.
 *
 * Decided by the angle and never by `backfaceVisibility`, which Android does
 * not honour reliably and some transform stacks drop. The swap lands exactly at
 * 90°, where the card is edge-on and nothing of either face is visible — so the
 * hard 0/1 never shows as a pop.
 */
export function resolveFlipFaces(rotation: number): { frontVisible: boolean; backVisible: boolean } {
	"worklet";
	const folded = ((rotation % 360) + 360) % 360;
	const frontVisible = folded < 90 || folded >= 270;
	return { backVisible: !frontVisible, frontVisible };
}

/** The face nearer the viewer at an angle — the one {@link resolveFlipFaces} draws. */
export function faceFromRotation(rotation: number): FlipCardFace {
	"worklet";
	const folded = ((rotation % 360) + 360) % 360;
	return folded < 90 || folded >= 270 ? "front" : "back";
}

/**
 * Where a released swipe settles.
 *
 * A flick past {@link FLIP_CARD_VELOCITY_THRESHOLD} goes the way it was going;
 * anything slower settles on the nearer face. Parked on exactly 90 with no
 * velocity it stays on the side the drag started from, so an undecided release
 * changes nothing.
 *
 * `velocity` is in degrees per second — see {@link resolveSwipeVelocity}.
 * Marked `"worklet"` and written flat: it calls nothing.
 */
export function resolveFlipTarget(rotation: number, velocity: number, from: 0 | 180 = 0): 0 | 180 {
	"worklet";
	if (velocity >= FLIP_CARD_VELOCITY_THRESHOLD) return 180;
	if (velocity <= -FLIP_CARD_VELOCITY_THRESHOLD) return 0;
	if (rotation < 90) return 0;
	if (rotation > 90) return 180;
	return from;
}

/** A pan's velocity in points per second, as degrees per second over a half-turn distance. */
export function resolveSwipeVelocity(velocity: number, distance: number): number {
	"worklet";
	if (distance <= 0) return 0;
	return (velocity * 180) / distance;
}

/**
 * The rotation a drag has reached: `distance` points of travel is a half turn.
 *
 * Deliberately unclamped — {@link resolveRubberBand} decides what happens past
 * an edge, so the two can be called one after the other from a gesture worklet
 * without either calling the other.
 */
export function rotationFromDrag(start: number, delta: number, distance: number): number {
	"worklet";
	if (distance <= 0) return start;
	return start + (delta * 180) / distance;
}

/**
 * A rotation past [0, 180], pulled back toward the edge it overshot.
 *
 * `max * o / (o + max)` — monotonic, a little under `o` for a small overshoot
 * and never reaching `max`, so the card leans past a rest under a hard drag and
 * cannot be turned over by one.
 *
 * `max` is resolved in the body, not as a parameter default: the worklets plugin
 * does not capture a module binding read from a default, and the UI thread throws.
 */
export function resolveRubberBand(rotation: number, max?: number): number {
	"worklet";
	const limit = max ?? FLIP_CARD_RUBBER_BAND;
	if (rotation < 0) {
		const overshoot = -rotation;
		return -((limit * overshoot) / (overshoot + limit));
	}
	if (rotation > 180) {
		const overshoot = rotation - 180;
		return 180 + (limit * overshoot) / (overshoot + limit);
	}
	return rotation;
}

/**
 * Whether the crossing haptic plays as the rotation moves from `prev` to `next`.
 *
 * The root passes the side it last ticked on — 0 or 180 — as `prev`, and the
 * crossing has to clear 90 by {@link FLIP_CARD_HAPTIC_HYSTERESIS}, so a finger
 * jittering on the edge-on frame plays once rather than every frame.
 */
export function shouldTickFlipHaptic(prev: number, next: number): boolean {
	"worklet";
	if (prev < 90) return next >= 90 + FLIP_CARD_HAPTIC_HYSTERESIS;
	if (prev > 90) return next < 90 - FLIP_CARD_HAPTIC_HYSTERESIS;
	return false;
}

/**
 * One face's transform at a rotation.
 *
 * `perspective` must come first — after the rotation, Android draws the turn as
 * a flat squash. The back is pre-rotated half a turn (`rotation - 180`), so it
 * starts edge-on past 90° and lands flat, and the right way round, on 180.
 */
export function resolveFaceTransform(
	face: FlipCardFace,
	axis: FlipCardAxis,
	rotation: number,
	perspective: number
): [{ perspective: number }, { rotateX: string } | { rotateY: string }] {
	"worklet";
	const angle = `${face === "front" ? rotation : rotation - 180}deg`;
	return [{ perspective }, axis === "x" ? { rotateX: angle } : { rotateY: angle }];
}

/**
 * One face's opacity at a rotation.
 *
 * Outside calm motion it is the 90° rule — a hard swap on the edge-on frame.
 * Under calm motion nothing turns, so the same 0→180 travel is read as a
 * linear crossfade instead: the faces sum to one at every frame and neither
 * ever pops.
 */
export function resolveFaceOpacity(face: FlipCardFace, rotation: number, isCalm: boolean): number {
	"worklet";
	if (isCalm) {
		const progress = Math.min(1, Math.max(0, rotation / 180));
		return face === "front" ? 1 - progress : progress;
	}
	const folded = ((rotation % 360) + 360) % 360;
	const frontVisible = folded < 90 || folded >= 270;
	return (face === "front") === frontVisible ? 1 : 0;
}

/**
 * Which face assistive technology may reach.
 *
 * Follows the **target** face — React state, set the moment a turn is
 * committed — never the per-frame rotation, or a screen reader would focus into
 * a face that is already fading out.
 */
export function resolveFaceA11y(face: FlipCardFace): Record<FlipCardFace, { hidden: boolean }> {
	return { back: { hidden: face !== "back" }, front: { hidden: face !== "front" } };
}

/**
 * The accessibility actions the card offers in place of its gesture.
 *
 * A card turned only by a gesture is unreachable to a screen reader, so every
 * trigger with a gesture on the root offers `activate` beside it. `"manual"`
 * has no gesture to replace: its path is the author's `FlipCard.Trigger`.
 */
export function resolveFlipCardActions(trigger: FlipCardTrigger): Array<{ name: string; label: string }> {
	if (trigger === "manual") return [];
	return [{ label: FLIP_CARD_ACTION_LABEL, name: "activate" }];
}

/** What `FlipCard.Trigger` tells a screen reader a press will do. */
export function resolveFlipCardTriggerHint(destination: FlipCardFace): string {
	return destination === "back" ? "Shows the back" : "Shows the front";
}

/** The `displayName`s of the two faces — what the root sorts its children by. */
export const FLIP_CARD_FACE_NAMES = ["DelacourUI.FlipCard.Front", "DelacourUI.FlipCard.Back"] as const;

/**
 * Whether a child's `displayName` names a face.
 *
 * The root asks this rather than `child.type === FlipCardFront`: the package
 * ships raw `.tsx`, so React Compiler or a second Metro instance of the module
 * can hand over an element whose `type` is a different object for the same
 * component. `displayName` survives both — see `Switch`'s `isSwitchThumbElement`.
 */
export function isFlipCardFaceName(displayName: string | undefined): boolean {
	return displayName === FLIP_CARD_FACE_NAMES[0] || displayName === FLIP_CARD_FACE_NAMES[1];
}
