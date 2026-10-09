import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { IconComponent } from "../icon/icon";
import type { MenuItemVariant } from "./menu.variants";

/**
 * What every row shares — an item, a checkbox row, a radio row and a sub-trigger.
 *
 * Built on `ViewProps` rather than `PressableProps`: a row drives its own press
 * fill on a tap of its own, so `feedback`, `asChild` and the pressable's other
 * knobs would be props it accepts and ignores.
 */
export type MenuItemProps = Omit<ViewProps, "children" | "style"> & {
	/** The label. A string is wrapped in a `Text` on the row's type. */
	children: ReactNode;
	className?: string;
	icon?: IconComponent;
	/** Which side the icon sits on. Default `leading`. */
	iconPlacement?: "leading" | "trailing";
	/** A second, quieter line under the label. */
	description?: string;
	/** A key hint drawn at the row's end, e.g. `⌘R`. */
	shortcut?: string;
	/** Anything else drawn at the row's end. */
	trailing?: ReactNode;
	variant?: MenuItemVariant;
	/** Reserve the icon column with no icon, so the label lines up with rows that have one. */
	isInset?: boolean;
	isDisabled?: boolean;
	/** Whether choosing the row closes the menu. Default `true`. */
	isClosedOnSelect?: boolean;
	onSelect?: () => void;
};
