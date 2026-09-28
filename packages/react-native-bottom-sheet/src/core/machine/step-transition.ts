/**
 * How one step gives way to the next, as a number per frame.
 *
 * `BottomSheet.Steps` drives a single `progress` from `0` to `1` when the
 * machine changes step, and both the outgoing and the incoming step read their
 * frame from it here. Kept in core so the three transitions are a table a
 * test can read rather than three `useAnimatedStyle`s a device has to show.
 */
import type { DetentSpec } from "../sheet.types";
import type { SheetEvent, SheetStateNode, SheetStepDirection } from "./machine.types";

/** The `transition` prop of `BottomSheet.Steps`. */
export type SheetStepTransition = "crossfade" | "slide" | "none";

/** Which side of a step change a view is on. */
export type SheetStepRole = "incoming" | "outgoing";

export type SheetStepFrame = { opacity: number; translateX: number };

/**
 * The opacity and horizontal offset of a step at `progress` through a change.
 *
 * `crossfade` fades the two across each other; `slide` moves the incoming step
 * in from the side the direction points away from and the outgoing one out the
 * other way, a whole `width` each; `none` swaps them on the first frame. An
 * unmeasured width (`< 0`) slides nothing.
 */
export function stepFrame(
	transition: SheetStepTransition,
	role: SheetStepRole,
	direction: SheetStepDirection,
	progress: number,
	width: number
): SheetStepFrame {
	"worklet";
	if (transition === "crossfade") {
		return { opacity: role === "incoming" ? progress : 1 - progress, translateX: 0 };
	}
	if (transition === "slide") {
		const span = width > 0 ? width : 0;
		const sign = direction === "forward" ? 1 : -1;
		const translateX = role === "incoming" ? (1 - progress) * span * sign : -progress * span * sign;
		return { opacity: 1, translateX };
	}
	return { opacity: role === "incoming" ? 1 : 0, translateX: 0 };
}

/** What a step asks the root to change while it is current. */
export type SheetStepOverride = {
	snapPoints: readonly DetentSpec[] | undefined;
	dismissible: boolean | undefined;
};

/** The override a step node declares — nothing more than its two sheet-facing fields, read once per step change. */
export function stepOverride<S extends string, C, E extends SheetEvent>(
	node: SheetStateNode<S, C, E>
): SheetStepOverride {
	return { snapPoints: node.snapPoints, dismissible: node.dismissible };
}
