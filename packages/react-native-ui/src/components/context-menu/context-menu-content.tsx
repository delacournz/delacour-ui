import { Children, isValidElement, type ReactElement, type ReactNode, useMemo } from "react";
import { MenuContent, type MenuContentProps } from "../menu/menu-content";
import { useContextMenuTarget } from "./context-menu.context";
import { CONTEXT_MENU_CONTENT_DEFAULTS } from "./context-menu.variants";
import { ContextMenuPreview } from "./context-menu-preview";

export type ContextMenuContentProps = Omit<MenuContentProps, "hasScrim" | "anchor" | "backdrop"> & {
	/** Tint the screen behind the panel. Default `true`. */
	hasScrim?: boolean;
};

/**
 * The panel: `Menu.Content` itself, with the defaults a held menu wants —
 * below, start-aligned, 8pt from the anchor, at least 280 wide, over a scrim.
 *
 * The anchor is this visit's: a zero-size point at the finger, or the trigger's
 * rect — forced to the rect when a `ContextMenu.Preview` is among the children.
 * The preview is lifted out by type and drawn through Menu's `backdrop`, over
 * the scrim and behind the panel.
 */
export function ContextMenuContent({
	children,
	placement = CONTEXT_MENU_CONTENT_DEFAULTS.placement,
	align = CONTEXT_MENU_CONTENT_DEFAULTS.align,
	offset = CONTEXT_MENU_CONTENT_DEFAULTS.offset,
	minWidth = CONTEXT_MENU_CONTENT_DEFAULTS.minWidth,
	hasScrim = CONTEXT_MENU_CONTENT_DEFAULTS.hasScrim,
	...props
}: ContextMenuContentProps): ReactElement {
	const { preview, rows } = useMemo(() => splitPreview(children), [children]);
	const { anchor } = useContextMenuTarget("ContextMenu.Content", preview !== null);

	return (
		<MenuContent
			align={align}
			anchor={anchor ?? undefined}
			backdrop={preview}
			hasScrim={hasScrim}
			minWidth={minWidth}
			offset={offset}
			placement={placement}
			{...props}
		>
			{rows}
		</MenuContent>
	);
}
ContextMenuContent.displayName = "DelacourUI.ContextMenu.Content";

/** Lifts a `ContextMenu.Preview` out of the rows, so it is drawn behind the panel instead of in it. */
function splitPreview(children: ReactNode): { preview: ReactElement | null; rows: ReactNode[] } {
	let preview: ReactElement | null = null;
	const rows: ReactNode[] = [];

	for (const child of Children.toArray(children)) {
		if (isValidElement(child) && child.type === ContextMenuPreview) {
			preview = child;
			continue;
		}
		rows.push(child);
	}

	return { preview, rows };
}
