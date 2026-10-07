import { useCallback, useEffect, useState } from "react";
import { I18nManager, type LayoutChangeEvent, useWindowDimensions, type ViewStyle } from "react-native";
import { KeyboardEvents } from "react-native-keyboard-controller";
import { type AnimatedStyle, useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type OverlayPresence, useOverlayPresence } from "../overlay";
import {
	type AnchoredPosition,
	type AnchoredSize,
	type AnchorRect,
	type PopoverAlign,
	type PopoverPlacement,
	type PopoverWidth,
	type ResolvedPopoverWidth,
	resolveAnchoredPosition,
	resolveEnterTranslate,
	resolvePopoverWidth,
	resolveTransformOrigin,
} from "./popover.position";

export type UseAnchoredContentOptions = {
	/** The owner's open state. The entrance waits for the first measure; the exit does not. */
	isOpen: boolean;
	/** The anchor's frame in window coordinates, `null` while it is being measured. */
	anchor: AnchorRect | null;
	placement: PopoverPlacement;
	align: PopoverAlign;
	offset: number;
	alignOffset: number;
	collisionPadding: number;
	arrowInset: number;
	width: PopoverWidth;
	minWidth?: number;
	maxHeight?: number;
	/** How far the panel travels on its way in. */
	enterDistance: number;
	/** The scale it grows from. */
	enterScale: number;
	onEntered?: () => void;
	onExited?: () => void;
};

export type AnchoredContent = {
	presence: OverlayPresence;
	/** Render the panel while true: from the open until the exit animation ends. */
	isMounted: boolean;
	/** The panel's resolved frame, `null` until both the anchor and the panel are measured. */
	position: AnchoredPosition | null;
	/** The panel's measured size, `null` until its first layout. */
	size: AnchoredSize | null;
	/** Put on the panel: it is how the panel is measured. */
	onLayout: (event: LayoutChangeEvent) => void;
	/** Width constraints and the clamped `maxHeight`, for the panel's `style`. */
	frameStyle: ResolvedPopoverWidth & { maxHeight?: number };
	/** Position, opacity and the entrance transform — put on the panel after `frameStyle`. */
	animatedStyle: AnimatedStyle<ViewStyle>;
};

/**
 * The keyboard's height while it is up, so a panel treats it as the bottom of
 * the screen — a field inside a popover flips the panel above its trigger
 * rather than typing under the keyboard. JS state, not a shared value: the
 * position is resolved on the JS thread, once per keyboard transition.
 */
function useKeyboardHeight(): number {
	const [height, setHeight] = useState(0);
	useEffect(() => {
		const subscriptions = [
			KeyboardEvents.addListener("keyboardWillShow", (event) => setHeight(event.height)),
			KeyboardEvents.addListener("keyboardDidShow", (event) => setHeight(event.height)),
			KeyboardEvents.addListener("keyboardWillHide", () => setHeight(0)),
			KeyboardEvents.addListener("keyboardDidHide", () => setHeight(0)),
		];
		return () => {
			for (const subscription of subscriptions) subscription.remove();
		};
	}, []);
	return height;
}

/**
 * Everything an anchored panel needs between its trigger and its first frame.
 *
 * 1. **Measure off-screen.** The panel mounts at the window's origin with
 *    opacity 0; its first layout reports its size.
 * 2. **Resolve.** With the anchor's rect and the panel's size,
 *    `resolveAnchoredPosition` picks the side, the shift, the clamped
 *    `maxHeight` and the arrow. The keyboard counts as the bottom inset.
 * 3. **Enter.** Only then does presence start: `progress` fades the panel in,
 *    slides it `enterDistance` from the anchor's side and scales it from
 *    `enterScale` about the arrow. Under reduce motion only the fade runs.
 *
 * The position is applied as a translate, never `left` / `top`: a translate is
 * not layout, so moving the panel never re-wraps its content and never fires
 * another `onLayout`. A window-size change re-resolves on the next render and
 * moves the panel there directly — re-placed, not re-animated.
 *
 * **A leaf.** Tooltip imports it; it imports nothing from `./popover` or
 * `./index`.
 */
export function useAnchoredContent({
	isOpen,
	anchor,
	placement,
	align,
	offset,
	alignOffset,
	collisionPadding,
	arrowInset,
	width,
	minWidth,
	maxHeight,
	enterDistance,
	enterScale,
	onEntered,
	onExited,
}: UseAnchoredContentOptions): AnchoredContent {
	const window = useWindowDimensions();
	const safeArea = useSafeAreaInsets();
	const keyboardHeight = useKeyboardHeight();
	const [size, setSize] = useState<AnchoredSize | null>(null);

	const bounds = {
		width: window.width,
		height: window.height,
		insets: {
			top: safeArea.top,
			right: safeArea.right,
			bottom: Math.max(safeArea.bottom, keyboardHeight),
			left: safeArea.left,
		},
	};

	const position =
		anchor === null || size === null
			? null
			: resolveAnchoredPosition({
					anchor,
					content: size,
					bounds,
					placement,
					align,
					offset,
					alignOffset,
					collisionPadding,
					arrowInset,
					maxHeight,
					isRTL: I18nManager.isRTL,
				});

	const presence = useOverlayPresence({ isOpen: isOpen && position !== null, onEntered, onExited });
	const isMounted = isOpen || presence.isPresent;

	useEffect(() => {
		if (!isMounted) setSize(null);
	}, [isMounted]);

	const onLayout = useCallback((event: LayoutChangeEvent) => {
		const { width: measuredWidth, height: measuredHeight } = event.nativeEvent.layout;
		setSize((previous) =>
			previous !== null && previous.width === measuredWidth && previous.height === measuredHeight
				? previous
				: { width: measuredWidth, height: measuredHeight }
		);
	}, []);

	const widths = resolvePopoverWidth({ width, anchorWidth: anchor?.width ?? 0, bounds, collisionPadding, minWidth });
	const frameStyle = position === null ? widths : { ...widths, maxHeight: position.maxHeight };

	// Destructured to primitives on purpose, as `Pressable` does: the worklet
	// closes over what it reads, and these are what change between renders.
	const progress = presence.progress;
	const isReduced = presence.isReduced;
	const isPlaced = position !== null;
	const x = position?.x ?? 0;
	const y = position?.y ?? 0;
	const enter = resolveEnterTranslate(position?.placement ?? placement, enterDistance);
	const enterX = enter.x;
	const enterY = enter.y;
	const origin = resolveTransformOrigin(
		position?.placement ?? placement,
		position?.arrowOffset ?? 0,
		size ?? { width: 0, height: 0 }
	);
	const originX = origin.x;
	const originY = origin.y;

	const animatedStyle = useAnimatedStyle(() => {
		if (!isPlaced) {
			return {
				opacity: 0,
				transformOrigin: [0, 0, 0],
				transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
			};
		}
		const shown = progress.value;
		const away = isReduced ? 0 : 1 - shown;
		return {
			opacity: shown,
			transformOrigin: [originX, originY, 0],
			transform: [
				{ translateX: x + enterX * away },
				{ translateY: y + enterY * away },
				{ scale: isReduced ? 1 : enterScale + (1 - enterScale) * shown },
			],
		};
	});

	return { presence, isMounted, position, size, onLayout, frameStyle, animatedStyle };
}
