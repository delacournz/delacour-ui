import type { ReactElement } from "react";
import { Separator, type SeparatorProps } from "../separator";
import { menuVariants } from "./menu.variants";

export type MenuSeparatorProps = Omit<SeparatorProps, "orientation">;

/** A rule between groups of rows — `Separator`, spaced for the panel. */
export function MenuSeparator({ className, ...props }: MenuSeparatorProps): ReactElement {
	return <Separator className={menuVariants().separator({ className })} {...props} />;
}
MenuSeparator.displayName = "DelacourUI.Menu.Separator";
