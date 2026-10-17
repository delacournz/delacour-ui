import type { ReactElement, ReactNode } from "react";
import { Pressable, type PressableProps } from "../pressable";
import { Text } from "../text";
import { useFramePart } from "./frame.context";
import { frameVariants } from "./frame.variants";

export type FrameActionProps = Omit<PressableProps, "disabled"> & {
	isDisabled?: boolean;
	children?: ReactNode;
};

/**
 * A text link at the end of the header — "Manage", "See all", "Edit".
 *
 * A `Pressable`, so `feedback`, `haptic`, `busy` and `asChild` come from there;
 * only the default differs, `fade`, because a text link that scales reads as
 * the header twitching. A bare string is wrapped in a label on the primary
 * token. It reserves a 44pt hit target and gives the height back to the header
 * with a negative margin, so the strip stays as tall as its type.
 *
 * Announced as a button. Pass `accessibilityRole="link"` when it navigates —
 * the caller's role is spread last and wins.
 */
export function FrameAction({
	feedback = "fade",
	isDisabled = false,
	className,
	children,
	...props
}: FrameActionProps): ReactElement {
	const { size } = useFramePart("Frame.Action");
	const slots = frameVariants({ isDisabled, size });
	const content =
		typeof children === "string" || typeof children === "number" ? (
			<Text className={slots.actionLabel()}>{children}</Text>
		) : (
			children
		);

	return (
		<Pressable className={slots.action({ className })} disabled={isDisabled} feedback={feedback} {...props}>
			{content}
		</Pressable>
	);
}
FrameAction.displayName = "DelacourUI.Frame.Action";
