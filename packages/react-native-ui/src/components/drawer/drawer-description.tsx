import type { ReactElement } from "react";
import { cn } from "../../lib/cn";
import { Text, type TextPresetProps } from "../text";
import { useDrawerPart } from "./drawer.context";

export type DrawerDescriptionProps = TextPresetProps;

/**
 * Supporting copy under the title.
 *
 * *Is* a `Text.Paragraph`, muted by default so the title and this read as a
 * hierarchy. `color` is an ordinary prop. It has no slot in `drawerVariants` —
 * see the note there.
 *
 * @example
 * <Drawer.Description>Signed in as aria@harbour.studio</Drawer.Description>
 */
export function DrawerDescription({ className, color = "muted", ...props }: DrawerDescriptionProps): ReactElement {
	const { descriptionId } = useDrawerPart("Drawer.Description");

	return <Text.Paragraph className={cn(className)} color={color} nativeID={descriptionId} {...props} />;
}
DrawerDescription.displayName = "DelacourUI.Drawer.Description";
