import { type ReactElement, type ReactNode, useEffect } from "react";
import type { ViewProps } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { useContextMenuPart, useContextMenuTarget } from "./context-menu.context";
import { CONTEXT_MENU_PREVIEW_MS, CONTEXT_MENU_PREVIEW_SCALE, contextMenuVariants } from "./context-menu.variants";

export type ContextMenuPreviewProps = Omit<ViewProps, "children"> & {
	/** What to lift. Default: the trigger's own children, rendered again. */
	children?: ReactNode;
	className?: string;
};

/**
 * The held content, lifted over the scrim while the menu is open.
 *
 * Placed among `ContextMenu.Content`'s rows, and lifted out of them by type: it
 * is drawn through Menu's `backdrop`, absolutely at the trigger's measured
 * window rect, grows 1 → 1.03 and casts a shadow. It takes no touches — a tap
 * on it is an outside tap.
 *
 * It renders the trigger's children **again**, as a second instance, so any
 * local state inside them starts fresh. Pass children of your own when that
 * matters. With a preview present, the panel anchors to the trigger's rect
 * rather than the press point, so it opens beside the copy, never across it.
 *
 * Under reduced motion it does not grow; it still appears, with the scrim.
 */
export function ContextMenuPreview({
	children,
	className,
	style,
	...props
}: ContextMenuPreviewProps): ReactElement | null {
	const { content } = useContextMenuPart("ContextMenu.Preview");
	const { targetRect } = useContextMenuTarget("ContextMenu.Preview", true);
	const isReducedMotion = useReducedMotion();

	const lift = useSharedValue(1);
	useEffect(() => {
		if (isReducedMotion) return;
		lift.value = withTiming(CONTEXT_MENU_PREVIEW_SCALE, { duration: CONTEXT_MENU_PREVIEW_MS });
	}, [isReducedMotion, lift]);
	const liftStyle = useAnimatedStyle(() => ({ transform: [{ scale: lift.value }] }));

	if (!targetRect) return null;

	const frame = { height: targetRect.height, left: targetRect.x, top: targetRect.y, width: targetRect.width };

	return (
		<Animated.View
			className={contextMenuVariants().preview({ className })}
			pointerEvents="none"
			style={[frame, liftStyle, style]}
			{...props}
		>
			{children ?? content}
		</Animated.View>
	);
}
ContextMenuPreview.displayName = "DelacourUI.ContextMenu.Preview";
