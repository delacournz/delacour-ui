import type { ReactElement, ReactNode } from "react";
import type { HapticFeedback } from "../pressable/pressable";
import { MenuRootProvider, useMenuRootValue } from "./menu.context";
import { MenuBackground } from "./menu-background";
import { MenuCheckboxItem } from "./menu-checkbox-item";
import { MenuContent } from "./menu-content";
import { MenuItem } from "./menu-item";
import { MenuLabel } from "./menu-label";
import { MenuRadioGroup } from "./menu-radio-group";
import { MenuRadioItem } from "./menu-radio-item";
import { MenuSeparator } from "./menu-separator";
import { MenuSub } from "./menu-sub";
import { MenuSubContent } from "./menu-sub-content";
import { MenuSubTrigger } from "./menu-sub-trigger";
import { MenuTrigger } from "./menu-trigger";

export type MenuProps = {
	children: ReactNode;
	/** Controlled open state. Leave it off and the menu holds its own. */
	isOpen?: boolean;
	/** Initial open state while uncontrolled. */
	defaultOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	/** Played when a row is chosen. Off by default. */
	haptic?: false | HapticFeedback;
};

function MenuRoot({ children, isOpen, defaultOpen, onOpenChange, haptic }: MenuProps): ReactElement {
	const value = useMenuRootValue({ defaultOpen, haptic, isOpen, onOpenChange });
	return <MenuRootProvider value={value}>{children}</MenuRootProvider>;
}

/**
 * A list of verbs dropped from the control that opens it — rename, duplicate,
 * share, delete.
 *
 * A menu is not a select: a row runs an action, it does not become the
 * trigger's value. The panel is anchored to the trigger, flips above it near
 * the bottom of the screen, stays inside the safe area, and scrolls when the
 * rows outgrow the room.
 *
 * Rows close the menu when chosen; `Menu.CheckboxItem` rows stay open, since
 * several are usually toggled at once. `Menu.Sub` expands in place. An outside
 * tap, Android's back button and a second press of the trigger all close it.
 *
 * State works either way from one hook: pass `isOpen` to control it, or leave
 * it off. `onOpenChange` hears both. `useMenu()` hands a custom part
 * `{ isOpen, open, close }`.
 *
 * @example
 * <Menu>
 *   <Menu.Trigger asChild>
 *     <Button variant="outline">Options</Button>
 *   </Menu.Trigger>
 *   <Menu.Content>
 *     <Menu.Item icon={IconPencil} onSelect={rename}>Rename</Menu.Item>
 *     <Menu.Separator />
 *     <Menu.Item icon={IconTrashCan} variant="destructive" onSelect={remove}>Delete</Menu.Item>
 *   </Menu.Content>
 * </Menu>
 */
export const Menu = Object.assign(MenuRoot, {
	/** The control that opens and closes the menu. `asChild` donates the press to a `Button`. */
	Trigger: MenuTrigger,
	/** The anchored panel, in a transparent `Modal`. */
	Content: MenuContent,
	/** The panel's surface. Pass one as a `Menu.Content` child to repaint it. */
	Background: MenuBackground,
	/** A section heading. */
	Label: MenuLabel,
	/** A verb: runs `onSelect` and closes. */
	Item: MenuItem,
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
	/** The row that expands a `Menu.Sub`. */
	SubTrigger: MenuSubTrigger,
	/** The rows a `Menu.Sub` discloses. */
	SubContent: MenuSubContent,
	displayName: "DelacourUI.Menu",
});
