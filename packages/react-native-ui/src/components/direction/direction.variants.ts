/**
 * Direction's pure resolvers. No React Native imports, so `bun test` reaches
 * every one, and each is tagged `"worklet"` so a gesture or `useAnimatedStyle`
 * can call it on the UI thread.
 */

/** The two reading directions, in a fixed order a demo can `.map()` over. */
export const DIRECTIONS = ["ltr", "rtl"] as const;

/** A reading direction: left-to-right or right-to-left. */
export type DirectionValue = (typeof DIRECTIONS)[number];

/** A logical edge of a row: where reading starts, or where it ends. */
export type LogicalSide = "start" | "end";

/** A physical edge of the screen. */
export type PhysicalSide = "left" | "right";

/**
 * The direction a subtree reads in. Its own `dir` wins; without one it
 * inherits the enclosing `Direction`; with neither it follows the app's
 * process-wide setting (`I18nManager.isRTL`, passed in as `systemIsRTL`).
 */
export function resolveDirection(
	own: DirectionValue | undefined,
	parent: DirectionValue | null,
	systemIsRTL: boolean
): DirectionValue {
	"worklet";
	if (own !== undefined) {
		return own;
	}
	if (parent !== null) {
		return parent;
	}
	return systemIsRTL ? "rtl" : "ltr";
}

/** `1` in LTR, `-1` in RTL. Multiply a physical x delta or a `translateX` by it. */
export function directionSign(dir: DirectionValue): 1 | -1 {
	"worklet";
	return dir === "rtl" ? -1 : 1;
}

/** The physical edge a logical one lands on: `start` is the right edge in RTL. */
export function physicalSide(side: LogicalSide, dir: DirectionValue): PhysicalSide {
	"worklet";
	const startsLeft = dir === "ltr";
	return (side === "start") === startsLeft ? "left" : "right";
}

/**
 * Converts an x measured from the start edge into one measured from the left
 * edge of a span `width` wide. It is its own inverse, so the same call takes a
 * left-edge x back to a start-edge one.
 */
export function mirrorX(x: number, width: number, dir: DirectionValue): number {
	"worklet";
	return dir === "rtl" ? width - x : x;
}

/**
 * Converts a physical gesture delta (positive is rightward) into a delta along
 * the reading axis (positive is towards the end edge).
 */
export function logicalDelta(dx: number, dir: DirectionValue): number {
	"worklet";
	return dx * directionSign(dir);
}
