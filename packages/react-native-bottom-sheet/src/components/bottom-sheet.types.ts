import type { ReactNode, Ref } from "react";
import type { PressableProps, TextInput, TextInputProps, TextProps, View, ViewProps } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { SheetAnimation } from "../animation/animation.types";
import type {
	AnimationSource,
	DetachedProp,
	KeyboardBehavior,
	KeyboardBlurBehavior,
	KeyboardScope,
	ReduceMotionMode,
	SnapPointSpec,
} from "../core";
import type { SheetHaptics } from "../gesture/gesture.types";

/**
 * The imperative surface, for the things with no declarative form.
 *
 * `open` and `close` are the same state a controlled `isOpen` drives;
 * `dismiss` is `close` under the name the library this replaces used. Every
 * method is an intent: none of them animates from the JS thread, and each is
 * a no-op when it makes no sense — `close` on a closed sheet, `snapToIndex(4)`
 * with two snap points.
 */
export type BottomSheetRef = {
	snapToIndex: (index: number) => void;
	/** A height or a `%` of the available height; clamped, never added as a snap point. */
	snapToPosition: (position: SnapPointSpec) => void;
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
	/** Controlled snap point index. Changing it snaps an open sheet. */
	index?: number;
	/** The snap point `open` lands on. @default 0 */
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
	snapPoints?: readonly SnapPointSpec[];
	/** Adds the content's own height as a snap point. @default true */
	dynamicSizing?: boolean;
	/** Caps the dynamic snap point. */
	maxDynamicContentSize?: number;
	/** Pixels the frame leaves clear at the top. @default 0 */
	topInset?: number;
	/** The safe-area inset an attached sheet reserves under its content. @default 0 */
	bottomInset?: number;
	/**
	 * A floating card: inset by `horizontalMargin` on both sides, resting
	 * `bottomOffset` above `bottomInset`, every corner the `Background`'s to
	 * round. `true` is `{ horizontalMargin: 16, bottomOffset: 16 }`. Closed is
	 * fully off-screen, `%` snap points resolve against the height above the resting
	 * line, and a tap in the margins or the gap closes.
	 */
	detached?: DetachedProp;
	/** @default true */
	enablePanDownToClose?: boolean;
	/** @default true */
	enableHandlePanningGesture?: boolean;
	/** @default true */
	enableContentPanningGesture?: boolean;
	/** Rubber-band past the snap points. @default true */
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
	/**
	 * What opening does to the other sheets already open in the same host:
	 * `push` stacks on top of them, `replace` closes them. @default "push"
	 */
	stackBehavior?: "push" | "replace";
	/** Android's back button closes the sheet while it is the top one in its host. @default true */
	closeOnBack?: boolean;
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
	 * Render where written — an absolute fill of the nearest positioned
	 * ancestor — rather than teleporting to a host. A persistent drawer, a map's
	 * result list. Never unmounts unless `unmountOnClose` says so.
	 */
	inline?: boolean;
	/** The `BottomSheet.Host` to teleport to. Default: the nearest one — `root` under a bare provider. */
	hostName?: string;
	/**
	 * Unmount the children once a close has settled. Default `true` when
	 * teleported and `false` when inline; the root's `keepMounted` forces it off.
	 */
	unmountOnClose?: boolean;
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
	/** What a press does: close, collapse to the first snap point, snap to an index, or nothing. @default "close" */
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

export type BottomSheetFooterProps = ViewProps & {
	ref?: Ref<View>;
	/**
	 * Stay put over the body and ride the keyboard by transform. Off, it is a
	 * plain `View` for a footer that scrolls with the content. @default true
	 */
	sticky?: boolean;
	/** Padding on the measured inner view, so it counts in the sheet's height. */
	padding?: number;
};

export type BottomSheetTextInputProps = TextInputProps & {
	ref?: Ref<TextInput>;
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
	/** How many snap points there were at the last settle. React state, for the handle's accessibility value. */
	snapPointCount: number;
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
	snapPoints: SharedValue<readonly number[]>;
	closedHeight: SharedValue<number>;
};
