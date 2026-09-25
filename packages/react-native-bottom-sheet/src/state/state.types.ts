import type { SharedValue } from "react-native-reanimated";
import type {
	AnimationSource,
	DetachedOptions,
	DetentSpec,
	GestureSource,
	KeyboardBehavior,
	KeyboardBlurBehavior,
	KeyboardScope,
	ScrollableType,
	SheetIntent,
	SheetState,
} from "../core";

/** Whether an animation is running. Numeric so the UI thread never serialises a string. */
export const ANIM_STATUS = {
	IDLE: 0,
	RUNNING: 1,
} as const;

export type AnimStatus = (typeof ANIM_STATUS)[keyof typeof ANIM_STATUS];

/**
 * The root's props as the UI thread needs them, mirrored into one shared value
 * so a worklet reads a snapshot rather than a dozen captured primitives that
 * would each rebuild the closure when they change.
 */
export type SheetWorkletConfig = {
	dynamicSizing: boolean;
	maxDynamicContentSize: number | undefined;
	hasFooter: boolean;
	bottomInset: number;
	detached: DetachedOptions | null;
	enablePanDownToClose: boolean;
	enableOverDrag: boolean;
	overDragResistanceFactor: number;
	initialIndex: number;
	animateOnMount: boolean;
	keyboardBehavior: KeyboardBehavior;
	keyboardBlurBehavior: KeyboardBlurBehavior;
	keyboardScope: KeyboardScope;
	enableBlurKeyboardOnGesture: boolean;
};

/**
 * Every raw shared value the sheet owns.
 *
 * Measurements start at `UNMEASURED` (`-1`); `base` is the only animated
 * value; everything else is written by a gesture, a layout callback or the JS
 * thread, and read by the derived geometry.
 */
export type SheetSharedState = {
	/** The frame the sheet lives in, `top: topInset` to the host's bottom. */
	containerHeight: SharedValue<number>;
	containerWidth: SharedValue<number>;
	/** Window bottom minus frame bottom — what a keyboard has to clear before it overlaps. */
	containerBottomOffset: SharedValue<number>;
	handleHeight: SharedValue<number>;
	contentHeight: SharedValue<number>;
	footerContentHeight: SharedValue<number>;
	/** The keyboard-free height. The only value an animation writes. */
	base: SharedValue<number>;
	/** The settled index, `-1` closed. Written on settle, never mid-flight. */
	currentIndex: SharedValue<number>;
	animStatus: SharedValue<AnimStatus>;
	animSource: SharedValue<AnimationSource>;
	animTarget: SharedValue<number>;
	gestureSource: SharedValue<GestureSource>;
	/** The scrollable's live offset, written by its scroll handler; negative while bounced past the top. */
	scrollOffsetY: SharedValue<number>;
	/** Where the scrollable is held while the sheet is below its highest detent. */
	scrollLockedAt: SharedValue<number>;
	/** Which scrollable is the body, `NONE` for static content. Set by `createBottomSheetScrollable` on focus. */
	scrollableType: SharedValue<ScrollableType>;
	keyboardOwned: SharedValue<boolean>;
	/** keyboard-controller's `progress`, `0` until BSHEET-3 wires the keyboard. */
	keyboardProgress: SharedValue<number>;
	/** The keyboard's height inside the container, positive, `0` until BSHEET-3. */
	keyboardHeight: SharedValue<number>;
	/** The pending request from the JS thread, `null` once resolved. */
	intent: SharedValue<SheetIntent | null>;
	/** Whether the next open is the mount open — reported as `"mount"` and skipped by `animateOnMount: false`. */
	mountPending: SharedValue<boolean>;
	/** The `snapPoints` prop, string-keyed so identity churn is harmless. */
	detentSpec: SharedValue<readonly DetentSpec[]>;
	config: SharedValue<SheetWorkletConfig>;
};

/**
 * Every number derived from the raw state, each a `useDerivedValue` over the
 * core's pure functions. Consumers read; nothing writes.
 */
export type SheetGeometry = {
	restingBottom: SharedValue<number>;
	closedHeight: SharedValue<number>;
	/** The height the sheet may occupy; what a `%` detent resolves against. */
	maxHeight: SharedValue<number>;
	/** The safe-area band an attached sheet reserves. */
	band: SharedValue<number>;
	bandNow: SharedValue<number>;
	/** Ascending, unique, the dynamic detent included when sizing to content. */
	detents: SharedValue<readonly number[]>;
	/** The last detent, or the closed height when there is none yet. */
	highest: SharedValue<number>;
	keyboardLift: SharedValue<number>;
	/** `base + keyboardLift`, clamped. What the view shows. */
	height: SharedValue<number>;
	/** `translateY` for the panel. */
	position: SharedValue<number>;
	/** Continuous index over `base`, `-1` closed. The overlay follows this. */
	index: SharedValue<number>;
	sheetState: SharedValue<SheetState>;
	layoutReady: SharedValue<boolean>;
	/** What the body may fill. */
	contentArea: SharedValue<number>;
	footerHeight: SharedValue<number>;
	footerTop: SharedValue<number>;
	/**
	 * How tall a detached card's surface is: `height` between the detents, the
	 * first detent's height below them and the last's above, so a close, a
	 * rubber-band and an over-drag move the card as a rigid body. Equal to
	 * `height` when attached.
	 */
	surfaceHeight: SharedValue<number>;
};
