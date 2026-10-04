import type { SheetIntent } from "../sheet.types";

/** Settle tolerance: a base within this of the closed height is closed. */
const SETTLE_EPSILON = 0.5;

/** What the resolver needs to know about the sheet at the moment an intent lands. */
export type IntentState = {
	/** The settled index, `-1` closed. */
	currentIndex: number;
	/**
	 * The keyboard-free height right now. A sheet is open when either says so:
	 * a release the list owned once left `currentIndex` at `-1` under a sheet
	 * sitting at its top, and a `close` read it as closed and did nothing.
	 */
	base: number;
	layoutReady: boolean;
	/** Ascending, normalised snap points. */
	snapPoints: readonly number[];
	closedHeight: number;
	/** The height the sheet may occupy — what a `%` position resolves against. */
	maxHeight: number;
	/** The index `open` targets. */
	initialIndex: number;
};

/**
 * What an intent turns into.
 *
 * `wait` keeps it queued for the next layout; `animate` and `jump` name a
 * target height; `null` is nothing at all — closing a closed sheet, opening
 * an open one, an index that does not exist.
 */
export type IntentResolution =
	| { action: "wait" }
	| { action: "animate"; target: number }
	| { action: "jump"; target: number };

/**
 * Resolves a request from the JS thread into a height to go to, or nothing.
 *
 * This is where present/dismiss's deadlocks go to die: a close before an
 * open is `null`, not a queued dismiss that fires when the sheet finally
 * presents; an open before the first layout waits for it rather than animating
 * from a guess; `forceClose` jumps. `snapToPosition` resolves a `%` against
 * `maxHeight` and clamps, without ever adding a snap point.
 *
 * Runs on the UI thread inside the intent reaction, so it is a flat worklet
 * and re-implements the little it needs of `heightForIndex` and `parseSnapPoint`
 * inline.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: the flat-worklet rule forbids extracting helpers; see the doc comment above.
export function resolveIntent(state: IntentState, intent: SheetIntent): IntentResolution | null {
	"worklet";
	const snapPoints = state.snapPoints;
	const count = snapPoints.length;
	// A detached sheet's closed height is negative and `base` starts at 0, so a
	// never-opened card must not read as open: a sheet is visibly open only when
	// its height is positive, hence the floor at 0.
	const isOpen = state.currentIndex >= 0 || state.base > Math.max(state.closedHeight, 0) + SETTLE_EPSILON;

	if (intent.kind === "close") {
		return isOpen ? { action: "animate", target: state.closedHeight } : null;
	}
	if (intent.kind === "forceClose") {
		return isOpen ? { action: "jump", target: state.closedHeight } : null;
	}
	if (intent.kind === "open" && isOpen) return null;
	if (!state.layoutReady) return { action: "wait" };

	if (intent.kind === "open") {
		if (count === 0) return null;
		const index =
			state.initialIndex < 0 ? 0 : state.initialIndex > count - 1 ? count - 1 : Math.floor(state.initialIndex);
		return { action: "animate", target: snapPoints[index] as number };
	}
	if (intent.kind === "snapToIndex") {
		const index = intent.index;
		if (index === -1) return isOpen ? { action: "animate", target: state.closedHeight } : null;
		if (!Number.isInteger(index) || index < 0 || index > count - 1) return null;
		return { action: "animate", target: snapPoints[index] as number };
	}
	if (intent.kind === "snapToPosition") {
		const position = intent.position;
		let height = Number.NaN;
		if (typeof position === "number") {
			height = position;
		} else if (typeof position === "string" && position.length > 1 && position.charCodeAt(position.length - 1) === 37) {
			height = (Number(position.slice(0, -1)) / 100) * state.maxHeight;
		}
		if (!Number.isFinite(height)) return null;
		const clamped =
			height < state.closedHeight ? state.closedHeight : height > state.maxHeight ? state.maxHeight : height;
		return { action: "animate", target: clamped };
	}
	if (count === 0) return null;
	if (intent.kind === "expand") return { action: "animate", target: snapPoints[count - 1] as number };
	return { action: "animate", target: snapPoints[0] as number };
}
