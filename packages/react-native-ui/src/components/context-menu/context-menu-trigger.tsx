import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { type AccessibilityActionEvent, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { type MenuMeasurable, useMenuPart } from "../menu/menu.context";
import { type HapticFeedback, playHaptic } from "../pressable/pressable";
import { useContextMenuPart } from "./context-menu.context";
import {
	CONTEXT_MENU_ACCESSIBILITY_ACTIONS,
	type ContextMenuAnchor,
	type ContextMenuInvoker,
	type ContextMenuPoint,
	contextMenuVariants,
	resolveContextAnchor,
	resolveContextMenuAccessibility,
	resolveHoldConfig,
} from "./context-menu.variants";

export type ContextMenuTriggerProps = Omit<ViewProps, "children"> & {
	/** The content that is held. Not cloned or altered, and it need not be pressable. */
	children: ReactNode;
	/** Lays out like a `View`; the wrapper does not shrink to its child. */
	className?: string;
	/** Open at the finger (`point`, default) or against the whole trigger (`target`). */
	anchor?: ContextMenuAnchor;
	/** How long the hold lasts before it opens, in ms. Default 350, at least 150. */
	delay?: number;
	/** How far the finger may drift during the hold, in pt. Default 12. */
	slop?: number;
	/** A short press. Arbitrated against the hold, so the two never both fire. */
	onPress?: () => void;
	/** Played the moment the hold is accepted. Off by default. */
	haptic?: false | HapticFeedback;
	/** Neither the hold nor `onPress` fires, and the trigger announces disabled. */
	isDisabled?: boolean;
};

/**
 * The content that is held: a message bubble, a card, a row.
 *
 * **One recogniser decides up front.** `Gesture.Exclusive(longPress, tap)`: the
 * tap waits for the hold to fail, so a hold that opens the menu never also
 * counts as a tap. That is why `onPress` belongs here, on the trigger, and not
 * on a pressable inside it — an inner press would race the hold instead.
 *
 * **A scroll that starts here still scrolls.** The hold fails once the finger
 * drifts past `slop`, and the scroller takes the touch.
 *
 * The haptic plays on the UI thread in the hold's `onStart`; the open crosses
 * to JS, measures the wrapper with `measureInWindow`, and anchors the panel at
 * the press point or against that rect.
 *
 * For a screen reader it is one element with two actions: `activate` runs
 * `onPress` (or opens, without one) and `longpress`, "Show menu", opens against
 * the trigger — there is no pointer coordinate to open at.
 */
export function ContextMenuTrigger({
	children,
	className,
	anchor = "point",
	delay,
	slop,
	onPress,
	haptic = false,
	isDisabled = false,
	...props
}: ContextMenuTriggerProps): ReactElement {
	const { isOpen, open, triggerRef } = useMenuPart("ContextMenu.Trigger");
	const { invoke, registerContent } = useContextMenuPart("ContextMenu.Trigger");
	const hold = resolveHoldConfig({ delay, slop });
	const hasPress = onPress !== undefined;
	const a11y = resolveContextMenuAccessibility({ hasPress, isDisabled, isOpen });

	useEffect(() => {
		registerContent(children);
	}, [children, registerContent]);

	const nodeRef = useRef<View | null>(null);
	const setNode = useCallback(
		(node: View | null) => {
			nodeRef.current = node;
			triggerRef.current = node as MenuMeasurable | null;
		},
		[triggerRef]
	);

	const openFrom = useCallback(
		(invokedBy: ContextMenuInvoker, point: ContextMenuPoint | null) => {
			const node = nodeRef.current;
			if (!node) return;
			node.measureInWindow((x, y, width, height) => {
				const targetRect = { height, width, x, y };
				const opened = resolveContextAnchor({ hasPreview: false, invokedBy, mode: anchor, point, targetRect });
				invoke({ invokedBy, mode: anchor, opened, point, targetRect });
				open(opened);
			});
		},
		[anchor, invoke, open]
	);

	const openAtPoint = useCallback((x: number, y: number) => openFrom("pointer", { x, y }), [openFrom]);

	const pressRef = useRef(onPress);
	pressRef.current = onPress;
	const handlePress = useCallback(() => pressRef.current?.(), []);

	const gesture = useMemo(() => {
		const longPress = Gesture.LongPress()
			.enabled(!isDisabled)
			.minDuration(hold.delay)
			.maxDistance(hold.slop)
			.onStart((event) => {
				"worklet";
				if (haptic) playHaptic(haptic);
				scheduleOnRN(openAtPoint, event.absoluteX, event.absoluteY);
			});

		if (!hasPress) return longPress;

		const tap = Gesture.Tap()
			.enabled(!isDisabled)
			.maxDistance(hold.slop)
			.maxDuration(Math.max(500, hold.delay))
			.shouldCancelWhenOutside(true)
			.onEnd((_event, isSuccess) => {
				"worklet";
				if (isSuccess) scheduleOnRN(handlePress);
			});

		return Gesture.Exclusive(longPress, tap);
	}, [handlePress, hasPress, haptic, hold.delay, hold.slop, isDisabled, openAtPoint]);

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			const outcome = a11y.onAction(event.nativeEvent.actionName);
			if (outcome === "press") handlePress();
			else if (outcome === "open") openFrom("accessibility", null);
		},
		[a11y, handlePress, openFrom]
	);

	return (
		<GestureDetector gesture={gesture}>
			<View
				accessibilityActions={CONTEXT_MENU_ACCESSIBILITY_ACTIONS}
				accessibilityRole={a11y.role}
				accessibilityState={a11y.state}
				accessible
				className={contextMenuVariants().trigger({ className })}
				collapsable={false}
				onAccessibilityAction={handleAccessibilityAction}
				ref={setNode}
				{...props}
			>
				{children}
			</View>
		</GestureDetector>
	);
}
ContextMenuTrigger.displayName = "DelacourUI.ContextMenu.Trigger";
