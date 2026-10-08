import type { ReactElement, ReactNode } from "react";
import { Text, type TextProps } from "../text";
import { useSlideButtonPart } from "./slide-button.context";
import { slideButtonVariants } from "./slide-button.variants";

export type SlideButtonLabelProps = Omit<TextProps, "children" | "className"> & {
	children: ReactNode;
	className?: string;
};

/**
 * What the slide does, centred in the whole rail.
 *
 * **It does not fade or move.** The handle passes over it. A label that faded as
 * the handle advanced would leave the control saying nothing for the second half
 * of the gesture — the half where the hand most wants to know what it is about to
 * confirm.
 *
 * Its text is also the rail's accessibility label, read off by the root, so the
 * screen reader announces the same words the eye reads.
 */
export function SlideButtonLabel({ className, ...props }: SlideButtonLabelProps): ReactElement {
	const { variant, size } = useSlideButtonPart("SlideButton.Label");
	return <Text className={slideButtonVariants({ size, variant }).label({ className })} numberOfLines={1} {...props} />;
}
SlideButtonLabel.displayName = "DelacourUI.SlideButton.Label";
