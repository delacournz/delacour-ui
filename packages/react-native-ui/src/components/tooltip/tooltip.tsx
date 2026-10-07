import { type ReactElement, type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { scheduleOnUI } from "react-native-worklets";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useOptionalOverlay } from "../overlay/overlay.context";
import { useAnchorMeasure } from "../popover/use-anchor-measure";
import { playHaptic } from "../pressable";
import { TooltipContext, type TooltipContextValue } from "./tooltip.context";
import {
	resolveTooltipDuration,
	shouldTooltipActivate,
	TOOLTIP_DEFAULTS,
	type TooltipGesture,
	type TooltipOpenOn,
} from "./tooltip.variants";
import { TooltipArrow } from "./tooltip-arrow";
import { TooltipContent } from "./tooltip-content";
import { TooltipDescription } from "./tooltip-description";
import { TooltipText } from "./tooltip-text";
import { TooltipTitle } from "./tooltip-title";
import { TooltipTrigger } from "./tooltip-trigger";

export type TooltipProps = {
	isOpen?: boolean;
	/** Default false. */
	defaultOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	/** `"longPress"` leaves the trigger's tap alone; `"press"` is for a trigger with no tap of its own. Default `"longPress"`. */
	openOn?: TooltipOpenOn;
	/** Auto-hide this many ms after the entrance settles. 0 = until an outside tap or the trigger again. Default 1500. */
	duration?: number;
	/** The text a screen reader reads for the trigger — the tooltip's words without opening it. */
	label?: string;
	children: ReactNode;
};

/** The one tooltip on screen. Opening another closes it. */
let current: { id: string; close: () => void } | null = null;

/** Whether VoiceOver or TalkBack is running, kept current. */
function useScreenReaderEnabled(): boolean {
	const [isEnabled, setEnabled] = useState(false);
	useEffect(() => {
		let isMounted = true;
		AccessibilityInfo.isScreenReaderEnabled().then((value) => {
			if (isMounted) setEnabled(value);
		});
		const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setEnabled);
		return () => {
			isMounted = false;
			subscription.remove();
		};
	}, []);
	return isEnabled;
}

function TooltipRoot({
	isOpen: isOpenProp,
	defaultOpen = false,
	onOpenChange,
	openOn = TOOLTIP_DEFAULTS.openOn,
	duration: durationProp,
	label,
	children,
}: TooltipProps): ReactElement {
	const id = useId();
	const [isOpen, setOpen] = useControllableState({
		value: isOpenProp,
		defaultValue: defaultOpen,
		onChange: onOpenChange,
	});
	const isScreenReaderEnabled = useScreenReaderEnabled();
	const duration = resolveTooltipDuration(durationProp, { isScreenReaderEnabled });
	const trigger = useAnchorMeasure({ isEnabled: isOpen });
	const subscribeTouchStart = useOptionalOverlay()?.subscribeTouchStart;

	// Set by the trigger's own `onTouchStart`, which bubbles to it before the
	// provider hears the same touch and closes the tooltip — so the activation
	// that follows knows this touch began on an open tooltip and leaves it shut.
	const wasOpenAtTriggerTouch = useRef(false);
	const isTouchInsideContent = useRef(false);

	const close = useCallback(() => setOpen(false), [setOpen]);

	const activate = useCallback(
		(gesture: TooltipGesture) => {
			if (!shouldTooltipActivate({ openOn, gesture, isScreenReaderEnabled })) return;
			const wasOpen = wasOpenAtTriggerTouch.current || isOpen;
			wasOpenAtTriggerTouch.current = false;
			if (wasOpen) {
				setOpen(false);
				return;
			}
			if (gesture === "longPress") scheduleOnUI(playHaptic, "selection");
			setOpen(true);
		},
		[openOn, isScreenReaderEnabled, isOpen, setOpen]
	);

	const onTriggerTouchStart = useCallback(() => {
		wasOpenAtTriggerTouch.current = isOpen;
	}, [isOpen]);

	const onContentTouchStart = useCallback(() => {
		isTouchInsideContent.current = true;
	}, []);

	useEffect(() => {
		if (!isOpen || subscribeTouchStart === undefined) return;
		return subscribeTouchStart(() => {
			if (isTouchInsideContent.current) {
				isTouchInsideContent.current = false;
				return;
			}
			setOpen(false);
		});
	}, [isOpen, subscribeTouchStart, setOpen]);

	useEffect(() => {
		if (!isOpen) return;
		if (current !== null && current.id !== id) current.close();
		current = { id, close };
		return () => {
			if (current?.id === id) current = null;
		};
	}, [isOpen, id, close]);

	const value = useMemo<TooltipContextValue>(
		() => ({
			isOpen,
			setOpen,
			close,
			openOn,
			label,
			duration,
			activate,
			onTriggerTouchStart,
			onContentTouchStart,
			anchorRect: trigger.rect,
			triggerRef: trigger.ref,
		}),
		[
			isOpen,
			setOpen,
			close,
			openOn,
			label,
			duration,
			activate,
			onTriggerTouchStart,
			onContentTouchStart,
			trigger.rect,
			trigger.ref,
		]
	);

	return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

/**
 * A short label naming the control under the finger — what an icon-only
 * button does, a shortcut, a one-line hint.
 *
 * Mobile has no hover, so it opens on a **long press** by default, with a
 * selection haptic, and the control's own tap still does what it did;
 * `openOn="press"` opens it on a tap instead, for a trigger with no tap of its
 * own — an info glyph. It hides itself `duration` ms after it appears, on the
 * trigger again, or on a tap anywhere else — and that tap still lands on what
 * it was aimed at. Opening one tooltip closes any other.
 *
 * It is not interactive: anything with a button in it is a `Popover`. The
 * panel is hidden from assistive technology; `label` reaches the trigger as
 * its accessibility label, or its hint when it already has a label, so
 * VoiceOver reads the words without anything opening.
 *
 * It draws in the overlay layer, so it needs `OverlayProvider` at the app root
 * — which is also what hears the outside tap.
 *
 * @example
 * <Tooltip label="Share">
 *   <Tooltip.Trigger asChild>
 *     <Button size="icon-md" variant="ghost"><Icon icon={IconShare} /></Button>
 *   </Tooltip.Trigger>
 *   <Tooltip.Content>
 *     <Tooltip.Arrow />
 *     <Tooltip.Text>Share</Tooltip.Text>
 *   </Tooltip.Content>
 * </Tooltip>
 *
 * @example
 * <Tooltip openOn="press" duration={0}>
 *   <Tooltip.Trigger accessibilityLabel="About sync"><Icon icon={IconCircleInfo} /></Tooltip.Trigger>
 *   <Tooltip.Content variant="surface">
 *     <Tooltip.Title>Sync</Tooltip.Title>
 *     <Tooltip.Description>Changes reach your other devices within a minute.</Tooltip.Description>
 *   </Tooltip.Content>
 * </Tooltip>
 */
export const Tooltip = Object.assign(TooltipRoot, {
	/** The control the tooltip names — `Pressable`, or `asChild` to donate the gesture. */
	Trigger: TooltipTrigger,
	/** The panel — teleported, measured, placed and animated; never interactive. */
	Content: TooltipContent,
	/** The arrow pointing from the panel at the trigger. */
	Arrow: TooltipArrow,
	/** The one-line label. */
	Text: TooltipText,
	/** A heading, for the surface variant. */
	Title: TooltipTitle,
	/** Supporting copy under the title, for the surface variant. */
	Description: TooltipDescription,
	displayName: "DelacourUI.Tooltip",
});
