import type { ReactElement } from "react";
import { IconCrossSmall } from "../../icons/central";
import { Icon } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useToastPart } from "./toast.context";
import { toastVariants } from "./toast.variants";

export type ToastCloseProps = Omit<PressableProps, "asChild" | "busy" | "children">;

/**
 * A trailing ✕ that hides the toast, then calls the caller's `onPress`.
 *
 * Muted rather than the status colour — it is about the toast, not part of
 * what it says — and pressed with `fade`, since a spring on a glyph this small
 * reads as a jitter. `hitSlop` lifts it to the 44-point target. A screen reader
 * reaches the same thing through the toast's `escape` and "Dismiss" actions.
 */
export function ToastClose({
	accessibilityLabel = "Dismiss",
	className,
	feedback = "fade",
	hitSlop = 12,
	onPress,
	...props
}: ToastCloseProps): ReactElement {
	const { hide } = useToastPart("Toast.Close");
	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			className={toastVariants().close({ className })}
			feedback={feedback}
			hitSlop={hitSlop}
			onPress={() => {
				hide();
				onPress?.();
			}}
			{...props}
		>
			<Icon color="muted-foreground" icon={IconCrossSmall} />
		</Pressable>
	);
}
ToastClose.displayName = "DelacourUI.Toast.Close";
