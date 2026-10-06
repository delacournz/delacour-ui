import { type ReactElement, useCallback, useId } from "react";
import {
	AccessibilityInfo,
	findNodeHandle,
	type LayoutChangeEvent,
	useWindowDimensions,
	View,
	type ViewProps,
} from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Overlay, useOverlayBackHandler, useOverlayPresence } from "../overlay";
import { type DialogFocusTarget, DialogSizeProvider, useDialogPart } from "./dialog.context";
import {
	DIALOG_ENTER_SCALE,
	DIALOG_ENTER_TRANSLATE_Y,
	DIALOG_KEYBOARD_MARGIN,
	type DialogSize,
	dialogVariants,
	resolveDialogKeyboardLift,
	resolveDialogRole,
} from "./dialog.variants";

export type DialogContentProps = ViewProps & {
	className?: string;
	/** Classes for the scrim behind the card. */
	scrimClassName?: string;
	/** The card's width cap: `sm` 320, `md` 400, `lg` 520, `full` the gutter. Default `md`. */
	size?: DialogSize;
};

/** Moves VoiceOver / TalkBack focus to a mounted element. A no-op when it has gone. */
function focus(target: DialogFocusTarget | null): void {
	if (target === null) return;
	const handle = findNodeHandle(target as Parameters<typeof findNodeHandle>[0]);
	if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
}

/**
 * The card, its scrim and the portal they draw through.
 *
 * Renders nothing until the dialog opens, and stays mounted through the exit
 * animation (`useOverlayPresence`), so the portal, the z-order and the back
 * button all follow presence with nothing else to keep in sync. It draws in the
 * `modal` band, above every bottom sheet and the navigator's header.
 *
 * - **Motion.** The scrim's opacity is `progress`; the card fades with it and
 *   grows from 0.96 and 8pt below. Under reduce motion only the fade runs.
 * - **Keyboard.** The card lifts by `resolveDialogKeyboardLift` — just enough
 *   to keep its bottom 16pt above the keyboard, never past the top inset — on
 *   the keyboard's own frames, and settles back when it closes.
 * - **Dismissal.** A scrim tap, Android back and the iOS escape gesture close a
 *   dismissible dialog. With `isDismissible={false}` the scrim still takes the
 *   touch so the app under it cannot be pressed, and only the dialog's own
 *   actions close it.
 * - **Accessibility.** The card is modal to assistive technology, announces as
 *   a `dialog` (an `alertdialog` when not dismissible), is labelled by the
 *   title, and moves focus to the title once it has entered — and back to the
 *   trigger, if one is still mounted, once it has gone.
 *
 * @example
 * <Dialog.Content size="sm">
 *   <Dialog.Header>…</Dialog.Header>
 * </Dialog.Content>
 */
export function DialogContent({
	className,
	scrimClassName,
	size = "md",
	children,
	onLayout,
	style,
	...props
}: DialogContentProps): ReactElement | null {
	const { isOpen, close, isDismissible, titleId, titleRef, triggerRef } = useDialogPart("Dialog.Content");
	const id = useId();

	const handleEntered = useCallback(() => focus(titleRef.current), [titleRef]);
	const handleExited = useCallback(() => focus(triggerRef.current), [triggerRef]);
	const { isPresent, isReduced, progress } = useOverlayPresence({
		isOpen,
		onEntered: handleEntered,
		onExited: handleExited,
	});

	useOverlayBackHandler({ id, isEnabled: isPresent && isDismissible, onBack: close });

	const keyboard = useReanimatedKeyboardAnimation();
	const { top: topInset } = useSafeAreaInsets();
	const { height: windowHeight } = useWindowDimensions();
	const cardTop = useSharedValue(0);
	const cardBottom = useSharedValue(0);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { y, height } = event.nativeEvent.layout;
			cardTop.value = y;
			cardBottom.value = y + height;
			onLayout?.(event);
		},
		[cardTop, cardBottom, onLayout]
	);

	const cardStyle = useAnimatedStyle(() => {
		const lift = resolveDialogKeyboardLift({
			cardBottom: cardBottom.value,
			cardTop: cardTop.value,
			keyboardHeight: keyboard.height.value,
			margin: DIALOG_KEYBOARD_MARGIN,
			topInset,
			windowHeight,
		});

		if (isReduced) {
			return { opacity: progress.value, transform: [{ translateY: -lift }] };
		}

		return {
			opacity: progress.value,
			transform: [
				{ translateY: interpolate(progress.value, [0, 1], [DIALOG_ENTER_TRANSLATE_Y, 0]) - lift },
				{ scale: interpolate(progress.value, [0, 1], [DIALOG_ENTER_SCALE, 1]) },
			],
		};
	}, [isReduced, topInset, windowHeight]);

	if (!isPresent) return null;

	const slots = dialogVariants({ size });
	const onEscape = isDismissible ? close : undefined;

	return (
		<Overlay.Portal id={id} layer="modal">
			<Overlay.Scrim className={slots.scrim({ className: scrimClassName })} onDismiss={onEscape} progress={progress} />
			<View className={slots.positioner()} pointerEvents="box-none">
				<Animated.View
					accessibilityLabelledBy={titleId}
					accessibilityViewIsModal
					className={slots.content({ className })}
					onAccessibilityEscape={onEscape}
					onLayout={handleLayout}
					role={resolveDialogRole(isDismissible)}
					style={[cardStyle, style]}
					{...props}
				>
					<DialogSizeProvider value={size}>{children}</DialogSizeProvider>
				</Animated.View>
			</View>
		</Overlay.Portal>
	);
}
DialogContent.displayName = "DelacourUI.Dialog.Content";
