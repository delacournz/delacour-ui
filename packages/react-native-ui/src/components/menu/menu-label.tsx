import type { ComponentRef, ReactElement } from "react";
import type Animated from "react-native-reanimated";
import { Text, type TextProps } from "../text";
import { useMenuFocusable } from "./menu.context";
import { menuVariants } from "./menu.variants";

export type MenuLabelProps = TextProps & {
	/** Line up with rows that reserve the icon column. */
	isInset?: boolean;
};

/** A section heading inside the panel. Not a row: it cannot be chosen. */
export function MenuLabel({ isInset = false, className, ...props }: MenuLabelProps): ReactElement {
	const focusRef = useMenuFocusable<ComponentRef<typeof Animated.Text>>();
	return (
		<Text
			accessibilityRole="header"
			className={menuVariants({ isInset }).label({ className })}
			ref={focusRef}
			{...props}
		/>
	);
}
MenuLabel.displayName = "DelacourUI.Menu.Label";
