import { Children, type ReactElement } from "react";
import { View } from "react-native";
import { useFramePart } from "./frame.context";
import type { FrameSlotProps } from "./frame.types";
import { type FrameFooterAlign, frameVariants, resolveFrameFooterJustify } from "./frame.variants";

export type FrameFooterProps = FrameSlotProps & {
	/**
	 * How the children sit on the row: `start`, `end` (the default), `between`,
	 * or `stretch`, which gives each child an equal share of the width.
	 */
	align?: FrameFooterAlign;
};

/**
 * The line under the tray — a status caption, a link, or a pair of decision
 * buttons.
 *
 * On `inset` it sits inside the shell's band; on `default` below the tray on
 * the lip; on `plain` a step under the card. `stretch` wraps each child in an
 * equal `flex-1` cell rather than reaching into the child's own props, so any
 * element — a `Button`, a `Pressable`, a `View` — takes its share the same way.
 */
export function FrameFooter({ align = "end", className, children, ...props }: FrameFooterProps): ReactElement {
	const { variant } = useFramePart("Frame.Footer");
	const { item } = resolveFrameFooterJustify(align);
	const content = item
		? Children.toArray(children).map((child, index) => (
				<View className={item} key={`cell-${index}`}>
					{child}
				</View>
			))
		: children;

	return (
		<View className={frameVariants({ align, variant }).footer({ className })} {...props}>
			{content}
		</View>
	);
}
FrameFooter.displayName = "DelacourUI.Frame.Footer";
