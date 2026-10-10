import type { ReactElement } from "react";
import type { MenuItemProps } from "../menu/menu.types";
import { MenuItem } from "../menu/menu-item";
import { contextMenuVariants } from "./context-menu.variants";

export type ContextMenuItemProps = MenuItemProps;

/**
 * A verb: `Menu.Item` itself, with its icon at the trailing edge by default
 * and a taller row. The same row, so the two menus cannot drift.
 *
 * @example
 * <ContextMenu.Item icon={IconShare} onSelect={share}>Share</ContextMenu.Item>
 */
export function ContextMenuItem({
	className,
	iconPlacement = "trailing",
	...props
}: ContextMenuItemProps): ReactElement {
	return <MenuItem className={contextMenuVariants().item({ className })} iconPlacement={iconPlacement} {...props} />;
}
ContextMenuItem.displayName = "DelacourUI.ContextMenu.Item";
