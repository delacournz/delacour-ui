import { type ReactElement, type ReactNode, useCallback, useEffect } from "react";
import { Pressable, type PressableProps } from "../pressable";
import { Text } from "../text";
import { useToastPart } from "./toast.context";
import { toastVariants } from "./toast.variants";

export type ToastActionProps = Omit<PressableProps, "asChild" | "busy" | "children"> & {
	/** The label. A string is set in the action's type; anything else is drawn as given. */
	children: ReactNode;
};

/**
 * The toast's one action — "Undo", "Retry", "View".
 *
 * A compact text button in the primary colour. Pressing it runs `onPress` and
 * then hides the toast: an action answered is a message finished with.
 *
 * The toast is one accessible element, so this control is not reachable on its
 * own with a screen reader. It registers itself with the root instead, which
 * exposes it as the group's `activate` action under this label — unless it is
 * `disabled`, when it is not offered and cannot run.
 */
export function ToastAction({
	accessibilityLabel,
	children,
	className,
	disabled = false,
	feedback = "fade",
	onPress,
	...props
}: ToastActionProps): ReactElement {
	const { hide, registerAction } = useToastPart("Toast.Action");
	const label = accessibilityLabel ?? (typeof children === "string" ? children : "Action");

	const run = useCallback(() => {
		if (disabled) return;
		onPress?.();
		hide();
	}, [disabled, onPress, hide]);

	// A disabled action is not offered to a screen reader at all: the card's
	// `activate` would otherwise run it past the Pressable's own disabled guard.
	useEffect(() => {
		if (disabled) return;
		registerAction({ label, run });
		return () => registerAction(null);
	}, [disabled, registerAction, label, run]);

	const slots = toastVariants();

	return (
		<Pressable
			accessibilityLabel={label}
			accessibilityRole="button"
			className={slots.action({ className })}
			disabled={disabled}
			feedback={feedback}
			hitSlop={6}
			onPress={run}
			{...props}
		>
			{typeof children === "string" ? <Text className={slots.actionLabel()}>{children}</Text> : children}
		</Pressable>
	);
}
ToastAction.displayName = "DelacourUI.Toast.Action";
