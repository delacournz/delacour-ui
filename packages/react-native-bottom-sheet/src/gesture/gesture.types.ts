import type { PanGesture } from "react-native-gesture-handler";

/**
 * A haptic, as a worklet. The engine imports nothing from a haptics library;
 * the skin passes `Presets.System.selection` and friends, which are worklets
 * already, and they fire on the UI thread in the same frame as the crossing.
 */
export type HapticWorklet = () => void;

export type SheetHaptics = {
	/** A drag crossed a detent. */
	onDetentHaptic?: HapticWorklet;
	/** A drag let go on a close. */
	onCloseHaptic?: HapticWorklet;
	/** A drag left the detent range and the rubber band took over. */
	onOverDragHaptic?: HapticWorklet;
};

export type SheetPanOptions = SheetHaptics & {
	enableHandlePanningGesture: boolean;
	enableContentPanningGesture: boolean;
};

/** The two pans, ready for a `GestureDetector` each. */
export type SheetPans = {
	handle: PanGesture;
	content: PanGesture;
};

/** Seconds of release velocity the snap projects along — the `0.2` the previous engine used. */
export const SNAP_PROJECTION = 0.2;

/** How far a finger travels vertically before the content pan claims it, in pixels. */
export const CONTENT_ACTIVE_OFFSET_Y = 6;

/** Horizontal travel that hands the touch to a horizontal scrollable or pager instead. */
export const CONTENT_FAIL_OFFSET_X = 12;
