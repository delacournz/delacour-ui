import type { ReactElement } from "react";
import { Text } from "../text";
import { useFramePart } from "./frame.context";
import type { FrameTextProps } from "./frame.types";
import { frameVariants } from "./frame.variants";

/**
 * The frame's heading — "Notifications", "Members".
 *
 * Carries its own colour, the foreground token of the plane it sits on, and its
 * own step on the type scale, read from the frame's context: a React Native
 * `View` does not cascade either to a `Text`. Announced as a header, so a screen
 * reader's rotor steps frame to frame down a settings screen.
 */
export function FrameTitle({ className, ...props }: FrameTextProps): ReactElement {
	const { size, plane } = useFramePart("Frame.Title");
	return (
		<Text
			accessibilityRole="header"
			className={frameVariants({ plane: plane ?? "none", size }).title({ className })}
			{...props}
		/>
	);
}
FrameTitle.displayName = "DelacourUI.Frame.Title";
