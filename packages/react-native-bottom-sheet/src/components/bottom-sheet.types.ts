import type { ReactNode, Ref } from "react";
import type { PressableProps, TextProps, View, ViewProps } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { SheetAnimation } from "../animation/animation.types";
import type {
	AnimationSource,
	DetachedProp,
	DetentSpec,
	KeyboardBehavior,
	KeyboardBlurBehavior,
	KeyboardScope,
	ReduceMotionMode,
} from "../core";
import type { SheetHaptics } from "../gesture/gesture.types";

/**
 * The imperative surface, for the things with no declarative form.
 *
 * `open` and `close` are the same state a controlled `isOpen` drives;
 * `dismiss` is `close` under the name the library this replaces used. Every
 * method is an intent: none of them animates from the JS thread, and each is
 * a no-op when it makes no sense — `close` on a closed sheet, `snapToIndex(4)`
 * with two detents.
 */
export type BottomSheetRef = {
	snapToIndex: (index: number) => void;
	/** A height or a `%` of the available height; clamped, never added as a detent. */
	snapToPosition: (position: DetentSpec) => void;
	expand: () => void;
	collapse: () => void;
	close: () => void;
	/** Closes with no animation. */
	forceClose: () => void;
	open: () => void;
	dismiss: () => void;
};

export type BottomSheetProps = SheetHaptics & {
	children?: ReactNode;
	ref?: Ref<BottomSheetRef>;
	/** Controlled open state. Leave it off and the sheet holds its own. */
	isOpen?: boolean;
	/** Initial open state while uncontrolled. */
	defaultOpen?: boolean;
	/**
	 * Called whenever the sheet opens or closes — by a trigger, a swipe down, a
	 * press on the overlay, `BottomSheet.Close`, the ref, or a controlled
	 * `isOpen`. One callback for every path.
	 */
	onOpenChange?: (isOpen: boolean) => void;
	/** Controlled detent index. Changing it snaps an open sheet. */
	index?: number;
	/** The detent `open` lands on. @default 0 */
	initialIndex?: number;
	/** The settled index changed — `-1` on close. */
	onIndexChange?: (index: number, height: number, source: AnimationSource) => void;
	/** An animation started. */
	onAnimate?: (
		fromIndex: number,
		toIndex: number,
		fromHeight: number,
		toHeight: number,
		source: AnimationSource
	) => void;
	/** The sheet reached its closed height, by any path. `onOpenChange(false)` follows. */
	onClose?: () => void;
	/** Heights above the resting bottom, or `%` of the available height. @default [] */
	snapPoints?: readonly DetentSpec[];
	/** Adds the content's own height as a detent. @default true */
	dynamicSizing?: boolean;
	/** Caps the dynamic detent. */
	maxDynamicContentSize?: number;
	/** Pixels the frame leaves clear at the top. @default 0 */
	topInset?: number;
	/** The safe-area inset an attached sheet reserves under its content. @default 0 */
	bottomInset?: number;
	/** A floating card. Geometry lands in BSHEET-5; accepted now so a skin can pass it through. */
	detached?: DetachedProp;
	/** @default true */
	enablePanDownToClose?: boolean;
	/** @default true */
	enableHandlePanningGesture?: boolean;
	/** @default true */
	enableContentPanningGesture?: boolean;
	/** Rubber-band past the detents. @default true */
	enableOverDrag?: boolean;
	/** Larger allows more travel. @default 2.5 */
	overDragResistanceFactor?: number;
	/** @default "interactive" */
	keyboardBehavior?: KeyboardBehavior;
	/** @default "restore" */
	keyboardBlurBehavior?: KeyboardBlurBehavior;
	/** @default "inside" */
	keyboardScope?: KeyboardScope;
	/** @default true */
	enableBlurKeyboardOnGesture?: boolean;
	/** A spring or a timing. Platform default when omitted. */
	animation?: SheetAnimation;
	/** Beats the config's own `reduceMotion`. */
	overrideReduceMotion?: ReduceMotionMode;
	/** Animate the first open, or land on it. @default true */
	animateOnMount?: boolean;
	/** Keep the portal's children mounted while closed. @default false */
	keepMounted?: boolean;
};

export type BottomSheetTriggerProps = Omit<PressableProps, "children"> & {
	children?: ReactNode;
	/** Hand `onPress` to the child rather than rendering a Pressable around it. */
	asChild?: boolean;
	ref?: Ref<View>;
};

export type BottomSheetPortalProps = {
	children?: ReactNode;
	style?: ViewProps["style"];
	ref?: Ref<View>;
	/**
	 * Render where written rather than teleporting to a host. The only mode until
	 * BSHEET-5; `hostName` is accepted now so a skin can pass it through.
	 */
	inline?: boolean;
	hostName?: string;
};

export type BottomSheetOverlayProps = Omit<ViewProps, "style"> & {
	style?: ViewProps["style"];
	ref?: Ref<View>;
	/** The index the scrim is fully in by. @default 0 */
	appearsOnIndex?: number;
	/** The index the scrim is gone by. @default -1 */
	disappearsOnIndex?: number;
	/** Opacity at full appearance. @default 1 */
	opacity?: number;
	/** What a press does: close, collapse to the first detent, snap to an index, or nothing. @default "close" */
	pressBehavior?: "close" | "collapse" | "none" | number;
	/** Let touches reach the app behind the scrim. @default false */
	enableTouchThrough?: boolean;
	/** Announced on the pressable scrim. @default "Close" */
	accessibilityLabel?: string;
	onPress?: () => void;
};

export type BottomSheetContainerProps = ViewProps & {
	ref?: Ref<View>;
};

export type BottomSheetBackgroundProps = ViewProps & {
	ref?: Ref<View>;
};

export type BottomSheetHandleProps = ViewProps & {
	ref?: Ref<View>;
	/** Overrides the root's `enableHandlePanningGesture` for this handle. */
	enablePanningGesture?: boolean;
};

export type BottomSheetContentProps = ViewProps & {
	ref?: Ref<View>;
	/** Extra space between the content and a sticky footer. @default 0 */
	footerGap?: number;
};

export type BottomSheetCloseProps = Omit<PressableProps, "children"> & {
	children?: ReactNode;
	asChild?: boolean;
	ref?: Ref<View>;
};

export type BottomSheetTitleProps = TextProps & {
	asChild?: boolean;
};

export type BottomSheetDescriptionProps = TextProps & {
	asChild?: boolean;
};

/** What `useBottomSheet()` returns: the open state and every ref method. */
export type BottomSheetContextValue = BottomSheetRef & {
	isOpen: boolean;
	setOpen: (open: boolean) => void;
	/** The settled index, `-1` closed. React state, updated on settle. */
	index: number;
	/** How many detents there were at the last settle. React state, for the handle's accessibility value. */
	detentCount: number;
};

/** What `useBottomSheetAnimated()` returns: the shared values a skin animates against. */
export type BottomSheetAnimatedValue = {
	animatedIndex: SharedValue<number>;
	animatedPosition: SharedValue<number>;
	animatedHeight: SharedValue<number>;
	containerHeight: SharedValue<number>;
	handleHeight: SharedValue<number>;
	contentHeight: SharedValue<number>;
	footerHeight: SharedValue<number>;
	keyboardLift: SharedValue<number>;
	detents: SharedValue<readonly number[]>;
	closedHeight: SharedValue<number>;
};
