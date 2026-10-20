import type { ReactElement } from "react";
import { Text } from "../text";
import { useFramePart } from "./frame.context";
import type { FrameTextProps } from "./frame.types";
import { frameVariants } from "./frame.variants";

/** The muted supporting line under the title, a step below it on the type scale. */
export function FrameDescription({ className, ...props }: FrameTextProps): ReactElement {
	const { size } = useFramePart("Frame.Description");
	return <Text className={frameVariants({ size }).description({ className })} {...props} />;
}
FrameDescription.displayName = "DelacourUI.Frame.Description";
