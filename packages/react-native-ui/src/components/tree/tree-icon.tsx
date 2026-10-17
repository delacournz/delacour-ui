import type { ReactElement } from "react";
import { View } from "react-native";
import type { TreeSlotProps } from "./tree.types";
import { treeVariants } from "./tree.variants";

export type TreeIconProps = TreeSlotProps;

/**
 * The node's leading glyph — a folder, a file type, a `Checkbox` for a
 * multi-select tree.
 *
 * An `Icon` inside inherits the row's glyph step and its foreground, which turns
 * to `accent-foreground` with the selection, so nothing here takes a size or a
 * colour.
 */
export function TreeIcon({ className, ...props }: TreeIconProps): ReactElement {
	return <View className={treeVariants().icon({ className })} {...props} />;
}
TreeIcon.displayName = "DelacourUI.Tree.Icon";
