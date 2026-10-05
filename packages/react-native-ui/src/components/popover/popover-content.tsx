import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
} from "react";
import { AccessibilityInfo, Pressable as NativePressable, ScrollView, View, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import { Overlay, useOverlayBackHandler } from "../overlay";
import { PopoverContentContext, type PopoverContentContextValue, usePopoverContext } from "./popover.context";
import type { PopoverAlign, PopoverPlacement, PopoverWidth } from "./popover.position";
import {
	POPOVER_ARROW_INSET,
	POPOVER_COLLISION_PADDING,
	POPOVER_DEFAULTS,
	POPOVER_ENTER_DISTANCE,
	POPOVER_ENTER_SCALE,
	popoverVariants,
} from "./popover.variants";
import { PopoverArrow } from "./popover-arrow";
import type { MeasurableNode } from "./use-anchor-measure";
import { useAnchoredContent } from "./use-anchored-content";

export type PopoverContentProps = ViewProps & {
	className?: string;
	/** The side of the anchor the panel prefers. It flips when that side lacks room. Default `"bottom"`. */
	placement?: PopoverPlacement;
	/** Which edges line up along the cross axis; logical under RTL. Default `"center"`. */
	align?: PopoverAlign;
	/** The gap between anchor and panel, in points. Default 8. */
	offset?: number;
	/** A nudge along the cross axis, inward from the aligned edge. Default 0. */
	alignOffset?: number;
	/** A number, the anchor's width, the content's own, or the safe span. Default `"content-fit"`. */
	width?: PopoverWidth;
	minWidth?: number;
	/** Clamped to the room on the resolved side. */
	maxHeight?: number;
	/** Scroll the body when it is taller than `maxHeight`. Default false. */
	isScrollable?: boolean;
	/** No surface, border, corner or padding — draw your own with `background`. */
	isUnstyled?: boolean;
	/** Drawn behind the content, filling the panel. */
	background?: ReactNode;
	/** Dim the app behind the panel. Default false — an outside tap still closes it. */
	hasScrim?: boolean;
	scrimClassName?: string;
};

/** Pulls `Popover.Arrow` out of the body, so a scrolling body never scrolls or clips it. */
function partitionArrow(children: ReactNode): { arrows: ReactNode[]; body: ReactNode[] } {
	const arrows: ReactNode[] = [];
	const body: ReactNode[] = [];
	Children.forEach(children, (child) => {
		if (isValidElement(child) && child.type === PopoverArrow) arrows.push(child);
		else body.push(child);
	});
	return { arrows, body };
}

/**
 * The panel, drawn over the app and anchored to the trigger.
 *
 * Renders nothing while closed. On open it mounts in the `anchored` band of
 * the overlay z-order — above every sheet and dialog — measures itself
 * invisibly, resolves where it fits, and enters from its resolved side. The
 * placement is a preference: the panel flips across the anchor when that side
 * lacks room and slides along it to stay inside the safe area and above the
 * keyboard.
 *
 * Under the panel, an invisible layer the size of the screen — or the scrim,
 * with `hasScrim` — closes the popover on a tap when it is dismissible. It
 * swallows the tap rather than passing it through to what is under it. Android
 * back closes it while it is the top overlay.
 *
 * The panel is a modal view labelled by its title: VoiceOver focus is held
 * inside it, moves to the title (or the panel) on entry and back to the
 * trigger on exit, and the escape gesture closes it.
 *
 * @example
 * <Popover.Content align="start" width="trigger" minWidth={260}>
 *   <Popover.Arrow />
 *   <Popover.Title>Rename</Popover.Title>
 *   <Input value={name} onChangeText={setName} />
 * </Popover.Content>
 */
export function PopoverContent({
	children,
	className,
	placement = POPOVER_DEFAULTS.placement,
	align = POPOVER_DEFAULTS.align,
	offset = POPOVER_DEFAULTS.offset,
	alignOffset = POPOVER_DEFAULTS.alignOffset,
	width = POPOVER_DEFAULTS.width,
	minWidth,
	maxHeight,
	isScrollable = false,
	isUnstyled = false,
	background,
	hasScrim = false,
	scrimClassName,
	style,
	...props
}: PopoverContentProps): ReactElement | null {
	const { isOpen, close, isDismissible, anchorRect, triggerNode, onPlaced } = usePopoverContext();
	const overlayId = useId();
	const titleId = useId();
	const panelNode = useRef<MeasurableNode | null>(null);
	const titleNode = useRef<MeasurableNode | null>(null);

	const focusIn = useCallback(() => {
		const target = titleNode.current ?? panelNode.current;
		if (target !== null) AccessibilityInfo.sendAccessibilityEvent(target, "focus");
	}, []);

	const focusBack = useCallback(() => {
		if (triggerNode.current !== null) AccessibilityInfo.sendAccessibilityEvent(triggerNode.current, "focus");
	}, [triggerNode]);

	const anchored = useAnchoredContent({
		isOpen,
		anchor: anchorRect,
		placement,
		align,
		offset,
		alignOffset,
		collisionPadding: POPOVER_COLLISION_PADDING,
		arrowInset: POPOVER_ARROW_INSET,
		width,
		minWidth,
		maxHeight,
		enterDistance: POPOVER_ENTER_DISTANCE,
		enterScale: POPOVER_ENTER_SCALE,
		onEntered: focusIn,
		onExited: focusBack,
	});

	const resolvedPlacement = anchored.position?.placement ?? placement;
	useEffect(() => onPlaced(resolvedPlacement), [onPlaced, resolvedPlacement]);

	const dismiss = useCallback(() => {
		if (isDismissible) close();
	}, [isDismissible, close]);

	useOverlayBackHandler({ id: overlayId, isEnabled: anchored.isMounted && isDismissible, onBack: close });

	const titleRef = useCallback((node: MeasurableNode | null) => {
		titleNode.current = node;
	}, []);
	const panelRef = useCallback((node: MeasurableNode | null) => {
		panelNode.current = node;
	}, []);

	const contentContext = useMemo<PopoverContentContextValue>(
		() => ({
			placement: resolvedPlacement,
			arrowOffset: anchored.position?.arrowOffset ?? 0,
			size: anchored.size ?? { width: 0, height: 0 },
			isUnstyled,
			titleId,
			titleRef,
		}),
		[resolvedPlacement, anchored.position?.arrowOffset, anchored.size, isUnstyled, titleId, titleRef]
	);

	if (!anchored.isMounted) return null;

	const slots = popoverVariants({ isUnstyled });
	const { arrows, body } = partitionArrow(children);

	// The catcher is written before the panel, so view order gives a touch on
	// the panel to the panel; it is React Native's own Pressable for the scrim's
	// reason — no feedback, no haptic, no gesture to race.
	return (
		<Overlay.Portal id={overlayId} layer="anchored">
			{hasScrim ? (
				<Overlay.Scrim
					className={slots.scrim({ className: scrimClassName })}
					onDismiss={dismiss}
					progress={anchored.presence.progress}
				/>
			) : (
				<NativePressable
					accessibilityElementsHidden
					accessible={false}
					className={slots.dismissLayer()}
					importantForAccessibility="no-hide-descendants"
					onPress={dismiss}
				/>
			)}
			<Animated.View
				accessibilityLabelledBy={titleId}
				accessibilityViewIsModal
				className={slots.content({ className })}
				onAccessibilityEscape={isDismissible ? close : undefined}
				onLayout={anchored.onLayout}
				ref={panelRef}
				role="dialog"
				style={[{ position: "absolute", left: 0, top: 0 }, anchored.frameStyle, style, anchored.animatedStyle]}
				{...props}
			>
				<PopoverContentContext.Provider value={contentContext}>
					{background === undefined ? null : (
						<View className="absolute inset-0" pointerEvents="none">
							{background}
						</View>
					)}
					{isScrollable ? (
						<ScrollView className="shrink grow-0" contentContainerClassName="gap-2" keyboardShouldPersistTaps="handled">
							{body}
						</ScrollView>
					) : (
						body
					)}
					{arrows}
				</PopoverContentContext.Provider>
			</Animated.View>
		</Overlay.Portal>
	);
}
PopoverContent.displayName = "DelacourUI.Popover.Content";
