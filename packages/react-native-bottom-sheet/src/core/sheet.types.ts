/**
 * The vocabulary every layer of the engine shares.
 *
 * Everything here is a plain type or a plain number so it can cross into a
 * worklet unchanged. The enums are numeric on purpose: a shared value holding
 * a string is a serialisation on every write, and `gestureSource` is written on
 * every frame of a pan.
 */

/**
 * A detent as the consumer writes it — pixels of sheet visible above its
 * resting bottom line, or a percentage of the height available to the sheet.
 *
 * Height space throughout: `0` is closed, detents ascend, and `translateY` is
 * derived from a height only at the moment a view needs it.
 */
export type DetentSpec = number | `${number}%`;

/** What the sheet does when a keyboard it owns appears. */
export type KeyboardBehavior = "interactive" | "extend" | "fillParent" | "none";

/** What the sheet does when the keyboard it lifted for goes away. */
export type KeyboardBlurBehavior = "none" | "restore";

/**
 * Which focused inputs count as the sheet's own.
 *
 * `registered` — only inputs that went through `useBottomSheetTextInput`.
 * `inside` — those, plus any focused input whose frame lies inside the sheet.
 * `always` — every keyboard, whoever asked for it.
 */
export type KeyboardScope = "registered" | "inside" | "always";

/** Why an animation started — reported through `onChange` and `onAnimate`. */
export type AnimationSource = "mount" | "gesture" | "user" | "snapPoints" | "keyboard" | "container";

/**
 * A request from the JS thread, resolved on the UI thread once layout is ready.
 *
 * Intents replace present/dismiss: closing a closed sheet resolves to nothing,
 * an open before the first layout waits for it, and `forceClose` skips the
 * animation. The `id` is what a reaction keys on, so two identical requests in
 * a row both run.
 */
export type SheetIntent =
	| { id: number; kind: "open" }
	| { id: number; kind: "close" }
	| { id: number; kind: "forceClose" }
	| { id: number; kind: "snapToIndex"; index: number }
	| { id: number; kind: "snapToPosition"; position: DetentSpec }
	| { id: number; kind: "expand" }
	| { id: number; kind: "collapse" };

/** Which pan is driving the sheet this frame. */
export const GESTURE_SOURCE = {
	NONE: 0,
	HANDLE: 1,
	CONTENT: 2,
} as const;

export type GestureSource = (typeof GESTURE_SOURCE)[keyof typeof GESTURE_SOURCE];

/** Where the sheet sits relative to its detents. */
export const SHEET_STATE = {
	CLOSED: 0,
	OPENED: 1,
	EXTENDED: 2,
	OVER_EXTENDED: 3,
	FILL: 4,
} as const;

export type SheetState = (typeof SHEET_STATE)[keyof typeof SHEET_STATE];

/** A measurement that has not happened yet. Every measured shared value starts here. */
export const UNMEASURED = -1;

/** The index the sheet reports while closed. */
export const CLOSED_INDEX = -1;
