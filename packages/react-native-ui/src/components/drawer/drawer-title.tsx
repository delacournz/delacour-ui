import { type ReactElement, useCallback } from "react";
import { cn } from "../../lib/cn";
import { Text, type TextPresetProps } from "../text";
import { type DrawerFocusTarget, useDrawerPart } from "./drawer.context";

/**
 * A `Text.Header`'s props less `ref`: the drawer holds the title's ref itself,
 * to move accessibility focus onto it.
 */
export type DrawerTitleProps = Omit<TextPresetProps, "ref">;

/**
 * The drawer's heading.
 *
 * *Is* a `Text.Header`. It carries the `nativeID` the panel is labelled by on
 * Android, and it is where accessibility focus lands once the panel has
 * finished entering, so a screen reader announces what the drawer is first.
 *
 * @example
 * <Drawer.Title>Menu</Drawer.Title>
 */
export function DrawerTitle({ className, ...props }: DrawerTitleProps): ReactElement {
	const { titleId, titleRef } = useDrawerPart("Drawer.Title");
	const setTitleRef = useCallback(
		(node: DrawerFocusTarget | null) => {
			titleRef.current = node;
		},
		[titleRef]
	);

	return (
		<Text.Header accessibilityRole="header" className={cn(className)} nativeID={titleId} ref={setTitleRef} {...props} />
	);
}
DrawerTitle.displayName = "DelacourUI.Drawer.Title";
