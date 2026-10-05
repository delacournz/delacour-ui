import type { ReactElement } from "react";
import type { MenuProps } from "../menu/menu";
import { MenuRootProvider, useMenuRootValue } from "../menu/menu.context";
import { MenuBackground } from "../menu/menu-background";
import { MenuCheckboxItem } from "../menu/menu-checkbox-item";
import { MenuLabel } from "../menu/menu-label";
import { MenuRadioGroup } from "../menu/menu-radio-group";
import { MenuRadioItem } from "../menu/menu-radio-item";
import { MenuSeparator } from "../menu/menu-separator";
import { MenuSub } from "../menu/menu-sub";
import { MenuSubContent } from "../menu/menu-sub-content";
import { MenuSubTrigger } from "../menu/menu-sub-trigger";
import { ContextMenuProvider, useContextMenuRootValue } from "./context-menu.context";
import { ContextMenuContent } from "./context-menu-content";
import { ContextMenuItem } from "./context-menu-item";
import { ContextMenuPreview } from "./context-menu-preview";
import { ContextMenuTrigger } from "./context-menu-trigger";

/** Menu's own root props: the open state, and the haptic played when a row is chosen. */
export type ContextMenuProps = MenuProps;

function ContextMenuRoot({ children, isOpen, defaultOpen, onOpenChange, haptic }: ContextMenuProps): ReactElement {
	const menu = useMenuRootValue({ defaultOpen, haptic, isOpen, onOpenChange });
	const context = useContextMenuRootValue();
	return (
		<MenuRootProvider value={menu}>
			<ContextMenuProvider value={context}>{children}</ContextMenuProvider>
		</MenuRootProvider>
	);
}

/**
 * The actions that belong to a piece of content — a message, a card, a row —
 * reached by holding the content itself.
 *
 * A `Menu` hangs off a control that exists to open it; a context menu has no
 * such control, because the target is the content. Hold it for 350ms and the
 * panel opens at the finger (or against the whole trigger with
 * `anchor="target"`); a short press runs the trigger's `onPress`, and never both.
 *
 * **The rows and the panel are Menu's.** `ContextMenu.Content` is
 * `Menu.Content` with a scrim and wider defaults, `ContextMenu.Item` is
 * `Menu.Item` with a trailing icon and a taller row, and every other row kind is
 * Menu's own component, so the two entry points cannot drift.
 *
 * `ContextMenu.Preview`, among the rows, lifts a copy of the held content over
 * the scrim, and the panel opens beside it.
 *
 * @example
 * <ContextMenu>
 *   <ContextMenu.Trigger haptic="medium" onPress={openThread}>
 *     <Card>…</Card>
 *   </ContextMenu.Trigger>
 *   <ContextMenu.Content>
 *     <ContextMenu.Preview />
 *     <ContextMenu.Item icon={IconShare} onSelect={share}>Share</ContextMenu.Item>
 *     <ContextMenu.Separator />
 *     <ContextMenu.Item icon={IconTrashCan} variant="destructive" onSelect={remove}>Delete</ContextMenu.Item>
 *   </ContextMenu.Content>
 * </ContextMenu>
 */
export const ContextMenu = Object.assign(ContextMenuRoot, {
	/** The content that is held. `onPress` is its short press, arbitrated against the hold. */
	Trigger: ContextMenuTrigger,
	/** The panel — `Menu.Content` over a scrim. */
	Content: ContextMenuContent,
	/** The held content, lifted over the scrim. Place it among the rows. */
	Preview: ContextMenuPreview,
	/** A verb: runs `onSelect` and closes. Icon trailing, row taller. */
	Item: ContextMenuItem,
	/** The panel's surface. Pass one as a `ContextMenu.Content` child to repaint it. */
	Background: MenuBackground,
	/** A section heading. */
	Label: MenuLabel,
	/** A row that toggles a setting. Stays open. */
	CheckboxItem: MenuCheckboxItem,
	/** Holds the value for a set of radio rows. */
	RadioGroup: MenuRadioGroup,
	/** One option in a radio group. Closes. */
	RadioItem: MenuRadioItem,
	/** A rule between groups of rows. */
	Separator: MenuSeparator,
	/** Nested rows that expand in place. */
	Sub: MenuSub,
	/** The row that expands a `ContextMenu.Sub`. */
	SubTrigger: MenuSubTrigger,
	/** The rows a `ContextMenu.Sub` discloses. */
	SubContent: MenuSubContent,
	displayName: "DelacourUI.ContextMenu",
});
