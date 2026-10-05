import { type ReactElement, useCallback, useEffect, useId, useMemo } from "react";
import {
	AccessibilityInfo,
	findNodeHandle,
	I18nManager,
	useWindowDimensions,
	View,
	type ViewProps,
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Overlay, useOverlayBackHandler, useOverlayPresence } from "../overlay";
import { type DrawerFocusTarget, DrawerPanelProvider, type DrawerPanelValue, useDrawerPart } from "./drawer.context";
import {
	type DrawerSide,
	type DrawerSize,
	drawerVariants,
	resolveDrawerDragFraction,
	resolveDrawerEdge,
	resolveDrawerExtent,
	resolveDrawerFrameExtent,
	resolveDrawerInsets,
	resolveDrawerOffset,
} from "./drawer.variants";
import { useDrawerPan } from "./use-drawer-pan";

export type DrawerContentProps = ViewProps & {
	className?: string;
	/** Classes for the scrim behind the panel. */
	scrimClassName?: string;
	/** The edge it opens from. `start` and `end` follow the layout direction. Default `"start"`. */
	side?: DrawerSide;
	/** The panel's width (start, end) or height (top, bottom): `sm` 62% to 280, `md` 78% to 320, `lg` 88% to 400, `full` 94%. Default `"md"`. */
	size?: DrawerSize;
	/** Whether a swipe toward the edge dismisses it. Default true. */
	isSwipeDismissible?: boolean;
};

/** Moves VoiceOver / TalkBack focus to a mounted element. A no-op when it has gone. */
function focus(target: DrawerFocusTarget | null): void {
	if (target === null) return;
	const handle = findNodeHandle(target as Parameters<typeof findNodeHandle>[0]);
	if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
}

/**
 * The panel, its scrim and the portal they draw through.
 *
 * Renders nothing until the drawer opens, and stays mounted through the exit
 * (`useOverlayPresence`), so the portal, the z-order and the back button all
 * follow presence. It draws in the `modal` band — over the navigator's header
 * and over an open bottom sheet.
 *
 * - **Geometry.** `side` resolves to a physical edge under `I18nManager.isRTL`;
 *   `size` to an extent along that edge's axis. The panel pads the safe-area
 *   insets on every side that meets a screen edge.
 * - **Motion.** Opening and closing slide the panel along `progress`; under
 *   reduce motion it fades in place instead. A swipe toward the edge drags it
 *   and thins the scrim with it; see `useDrawerPan` for the release.
 * - **Dismissal.** A scrim tap, Android back, the iOS escape gesture and the
 *   swipe close a dismissible drawer. With `isDismissible={false}` the scrim
 *   still takes the touch and only the drawer's own actions close it.
 * - **Accessibility.** The panel is modal to assistive technology, a `dialog`
 *   labelled by the title; focus moves to the title once it has entered and
 *   back to the trigger, if still mounted, once it has gone.
 *
 * @example
 * <Drawer.Content side="end" size="lg">
 *   <Drawer.Header>…</Drawer.Header>
 *   <Drawer.Body>…</Drawer.Body>
 * </Drawer.Content>
 */
export function DrawerContent({
	className,
	scrimClassName,
	side = "start",
	size = "md",
	isSwipeDismissible = true,
	children,
	style,
	...props
}: DrawerContentProps): ReactElement | null {
	const { isOpen, close, isDismissible, titleId, titleRef, triggerRef } = useDrawerPart("Drawer.Content");
	const id = useId();

	const isRTL = I18nManager.isRTL;
	const edge = resolveDrawerEdge(side, isRTL);
	const isHorizontal = edge === "left" || edge === "right";
	const window = useWindowDimensions();
	const safeArea = useSafeAreaInsets();
	const insets = resolveDrawerInsets(edge, safeArea);
	const extent = resolveDrawerFrameExtent(
		edge,
		resolveDrawerExtent(size, isHorizontal ? window.width : window.height),
		insets
	);

	const handleEntered = useCallback(() => focus(titleRef.current), [titleRef]);
	const handleExited = useCallback(() => focus(triggerRef.current), [triggerRef]);
	const { isPresent, isReduced, progress } = useOverlayPresence({
		isOpen,
		onEntered: handleEntered,
		onExited: handleExited,
	});

	useOverlayBackHandler({ id, isEnabled: isPresent && isDismissible, onBack: close });

	const drag = useSharedValue(0);
	useEffect(() => {
		if (isOpen) drag.value = 0;
	}, [isOpen, drag]);

	const pan = useDrawerPan({
		drag,
		edge,
		extent,
		isEnabled: isSwipeDismissible && isDismissible,
		onDismiss: close,
	});

	// The scrim fades with presence and thins as a drag carries the panel out.
	// A shared value of its own, because `Overlay.Scrim` takes a writable one.
	const scrimProgress = useSharedValue(0);
	useAnimatedReaction(
		() => progress.value * (1 - resolveDrawerDragFraction(edge, drag.value, extent)),
		(visibility) => {
			scrimProgress.value = visibility;
		},
		[edge, extent]
	);

	const panelStyle = useAnimatedStyle(() => {
		const slide = isReduced ? { translateX: 0, translateY: 0 } : resolveDrawerOffset(edge, extent, progress.value);
		return {
			opacity: isReduced ? progress.value : 1,
			transform: [
				{ translateX: slide.translateX + (isHorizontal ? drag.value : 0) },
				{ translateY: slide.translateY + (isHorizontal ? 0 : drag.value) },
			],
		};
	}, [edge, extent, isHorizontal, isReduced]);

	const panel = useMemo<DrawerPanelValue>(() => ({ edge, side }), [edge, side]);

	if (!isPresent) return null;

	const slots = drawerVariants({ edge });
	const onEscape = isDismissible ? close : undefined;
	const frame = {
		height: isHorizontal ? undefined : extent,
		paddingBottom: insets.bottom,
		paddingLeft: insets.left,
		paddingRight: insets.right,
		paddingTop: insets.top,
		width: isHorizontal ? extent : undefined,
	};

	return (
		<Overlay.Portal id={id} layer="modal">
			<Overlay.Scrim
				className={slots.scrim({ className: scrimClassName })}
				onDismiss={onEscape}
				progress={scrimProgress}
			/>
			<View className={slots.positioner()} pointerEvents="box-none" style={{ direction: "ltr" }}>
				<GestureDetector gesture={pan}>
					<Animated.View
						accessibilityLabelledBy={titleId}
						accessibilityViewIsModal
						className={slots.content({ className })}
						onAccessibilityEscape={onEscape}
						role="dialog"
						style={[frame, panelStyle, style]}
						{...props}
					>
						<View className={slots.inner()} style={{ direction: isRTL ? "rtl" : "ltr" }}>
							<DrawerPanelProvider value={panel}>{children}</DrawerPanelProvider>
						</View>
					</Animated.View>
				</GestureDetector>
			</View>
		</Overlay.Portal>
	);
}
DrawerContent.displayName = "DelacourUI.Drawer.Content";
