import { isValidElement, type ReactElement, type ReactNode } from "react";
import { View } from "react-native";
import { useFramePart } from "./frame.context";
import type { FrameSlotProps } from "./frame.types";
import { frameVariants, splitFrameHeaderChildren } from "./frame.variants";
import { FrameAction } from "./frame-action";
import { FrameTitle } from "./frame-title";

function isFrameAction(node: ReactNode): boolean {
	return isValidElement(node) && node.type === FrameAction;
}

/**
 * Wraps a bare string or number in a `Frame.Title`. A raw string inside a `View`
 * is a red box in React Native, and a header's bare text is its title.
 */
function wrapBareText(node: ReactNode, index: number): ReactNode {
	return typeof node === "string" || typeof node === "number" ? (
		<FrameTitle key={`title-${index}`}>{node}</FrameTitle>
	) : (
		node
	);
}

/**
 * The strip above the tray: a title and description stacked on the left, and
 * any `Frame.Action` at the end of the row.
 *
 * The header lifts every action out of the text column wherever it is written,
 * so the order of children does not matter and a long title wraps in the width
 * the action leaves instead of pushing it off the edge.
 */
export function FrameHeader({ className, children, ...props }: FrameSlotProps): ReactElement {
	const { variant } = useFramePart("Frame.Header");
	const slots = frameVariants({ variant });
	const { text, actions } = splitFrameHeaderChildren(children, isFrameAction);

	return (
		<View className={slots.header({ className })} {...props}>
			<View className={slots.headerText()}>{text.map(wrapBareText)}</View>
			{actions}
		</View>
	);
}
FrameHeader.displayName = "DelacourUI.Frame.Header";
