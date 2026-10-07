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
import { ScrollView, View, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import { Overlay, useOverlayBackHandler } from "../overlay";
import type { PopoverAlign, PopoverPlacement, PopoverWidth } from "../popover/popover.position";
import { POPOVER_ARROW_INSET, POPOVER_COLLISION_PADDING } from "../popover/popover.variants";
import { useAnchoredContent } from "../popover/use-anchored-content";
import { TooltipContentContext, type TooltipContentContextValue, useTooltipContext } from "./tooltip.context";
import { TOOLTIP_DEFAULTS, TOOLTIP_ENTER_DISTANCE, type TooltipVariant, tooltipVariants } from "./tooltip.variants";
import { TooltipArrow } from "./tooltip-arrow";

export type TooltipContentProps = ViewProps & {
	className?: string;
	/** The side of the trigger the panel prefers. It flips when that side lacks room. Default `"top"`. */
	placement?: PopoverPlacement;
	/** Which edges line up along the cross axis; logical under RTL. Default `"center"`. */
	align?: PopoverAlign;
	/** The gap between trigger and panel, in points. Default 6. */
	offset?: number;
	/** A nudge along the cross axis, inward from the aligned edge. Default 0. */
	alignOffset?: number;
	/** `"inverted"` — a dark chip for one line; `"surface"` — a popover card for a title and a description. Default `"inverted"`. */
	variant?: TooltipVariant;
	/** A number, the trigger's width, the content's own, or the safe span. Default `"content-fit"`. */
	width?: PopoverWidth;
	minWidth?: number;
	/** Clamped to the room on the resolved side. */
	maxHeight?: number;
	/** Scroll the body when it is taller than `maxHeight` — the one case the panel takes a touch. Default false. */
	isScrollable?: boolean;
};

/** Pulls `Tooltip.Arrow` out of the body, so a scrolling body never scrolls or clips it. */
function partitionArrow(children: ReactNode): { arrows: ReactNode[]; body: ReactNode[] } {
	const arrows: ReactNode[] = [];
	const body: ReactNode[] = [];
	Children.forEach(children, (child) => {
		if (isValidElement(child) && child.type === TooltipArrow) arrows.push(child);
		else body.push(child);
	});
	return { arrows, body };
}

/**
 * The panel, drawn over the app and anchored to the trigger.
 *
 * Renders nothing while closed. On open it mounts in the `anchored` band of
 * the overlay z-order, measures itself invisibly, resolves where it fits —
 * Popover's resolver, so it flips and shifts the same way — and fades in from
 * 4pt toward its resolved side; under reduce motion it only fades. `duration`
 * ms after that entrance settles it hides itself.
 *
 * It takes no touch: there is no catcher under it and the panel is
 * `pointerEvents="none"`, so a tap anywhere — the panel included — reaches
 * what is under it, and the provider closes the tooltip on the way. Only an
 * `isScrollable` body takes a touch, to scroll. It is hidden from assistive
 * technology and never takes focus: its words already reached the trigger.
 * Android back closes it while it is the top overlay.
 *
 * @example
 * <Tooltip.Content placement="bottom">
 *   <Tooltip.Arrow />
 *   <Tooltip.Text>Copy link</Tooltip.Text>
 * </Tooltip.Content>
 */
export function TooltipContent({
	children,
	className,
	placement = TOOLTIP_DEFAULTS.placement,
	align = TOOLTIP_DEFAULTS.align,
	offset = TOOLTIP_DEFAULTS.offset,
	alignOffset = TOOLTIP_DEFAULTS.alignOffset,
	variant = TOOLTIP_DEFAULTS.variant,
	width = TOOLTIP_DEFAULTS.width,
	minWidth,
	maxHeight,
	isScrollable = false,
	style,
	onTouchStart,
	...props
}: TooltipContentProps): ReactElement | null {
	const { isOpen, close, duration, anchorRect, onContentTouchStart } = useTooltipContext();
	const overlayId = useId();
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearTimer = useCallback(() => {
		if (timer.current === null) return;
		clearTimeout(timer.current);
		timer.current = null;
	}, []);

	const startTimer = useCallback(() => {
		clearTimer();
		if (duration > 0) timer.current = setTimeout(close, duration);
	}, [clearTimer, close, duration]);

	useEffect(() => {
		if (!isOpen) clearTimer();
	}, [isOpen, clearTimer]);
	useEffect(() => clearTimer, [clearTimer]);

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
		enterDistance: TOOLTIP_ENTER_DISTANCE,
		enterScale: 1,
		onEntered: startTimer,
	});

	useOverlayBackHandler({ id: overlayId, isEnabled: anchored.isMounted, onBack: close });

	const contentContext = useMemo<TooltipContentContextValue>(
		() => ({
			variant,
			placement: anchored.position?.placement ?? placement,
			arrowOffset: anchored.position?.arrowOffset ?? 0,
			size: anchored.size ?? { width: 0, height: 0 },
		}),
		[variant, anchored.position?.placement, placement, anchored.position?.arrowOffset, anchored.size]
	);

	if (!anchored.isMounted) return null;

	const { arrows, body } = partitionArrow(children);

	return (
		<Overlay.Portal id={overlayId} layer="anchored">
			<Animated.View
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
				onLayout={anchored.onLayout}
				pointerEvents={isScrollable ? "box-none" : "none"}
				style={[anchored.positionerStyle, anchored.animatedStyle]}
			>
				<View
					accessible={false}
					className={tooltipVariants({ variant }).content({ className })}
					onTouchStart={(event) => {
						onContentTouchStart();
						onTouchStart?.(event);
					}}
					style={[anchored.frameStyle, style]}
					{...props}
				>
					<TooltipContentContext.Provider value={contentContext}>
						{isScrollable ? (
							<ScrollView className="shrink grow-0" contentContainerClassName="gap-1">
								{body}
							</ScrollView>
						) : (
							body
						)}
						{arrows}
					</TooltipContentContext.Provider>
				</View>
			</Animated.View>
		</Overlay.Portal>
	);
}
TooltipContent.displayName = "DelacourUI.Tooltip.Content";
