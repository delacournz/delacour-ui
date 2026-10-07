import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { drawerVariants } from "./drawer.variants";
import { DrawerClose } from "./drawer-close";

export type DrawerHeaderProps = ViewProps & {
	className?: string;
	/** Hide the ✕ the header writes at its trailing edge. Default false. */
	isCloseHidden?: boolean;
};

/**
 * The top of the panel: `Drawer.Title` and `Drawer.Description` in a column
 * that takes the row's slack, and a ✕ at the trailing edge.
 *
 * The ✕ is in the flow, not pinned to a corner, so a long title wraps before
 * it rather than under it, and it lands on the correct side under RTL with no
 * rule of its own. `isCloseHidden` drops it — a navigation drawer whose rows
 * all close it, or a drawer with a `Close` in its footer.
 *
 * @example
 * <Drawer.Header>
 *   <Drawer.Title>Filters</Drawer.Title>
 *   <Drawer.Description>12 results</Drawer.Description>
 * </Drawer.Header>
 */
export function DrawerHeader({
	className,
	isCloseHidden = false,
	children,
	...props
}: DrawerHeaderProps): ReactElement {
	const slots = drawerVariants();

	return (
		<View className={slots.header({ className })} {...props}>
			<View className={slots.heading()}>{children}</View>
			{isCloseHidden ? null : <DrawerClose />}
		</View>
	);
}
DrawerHeader.displayName = "DelacourUI.Drawer.Header";
