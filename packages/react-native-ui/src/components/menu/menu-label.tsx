import type { ReactElement } from "react";
import { Text, type TextProps } from "../text";
import { menuVariants } from "./menu.variants";

export type MenuLabelProps = TextProps & {
	/** Line up with rows that reserve the icon column. */
	isInset?: boolean;
};

/** A section heading inside the panel. Not a row: it cannot be chosen. */
export function MenuLabel({ isInset = false, className, ...props }: MenuLabelProps): ReactElement {
	return <Text accessibilityRole="header" className={menuVariants({ isInset }).label({ className })} {...props} />;
}
MenuLabel.displayName = "DelacourUI.Menu.Label";
