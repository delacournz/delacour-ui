import type { ReactElement } from "react";
import { View } from "react-native";
import type { TreeSlotProps } from "./tree.types";
import { treeVariants } from "./tree.variants";

export type TreeActionsProps = TreeSlotProps;

/**
 * Trailing content: a count, a badge, a menu button.
 *
 * `Tree.Trigger` lifts it out of the row's `Pressable` and renders it beside
 * it, so a button here is pressed on its own — its tap never reaches the row —
 * and is its own element to a screen reader rather than merged into the row's.
 */
export function TreeActions({ className, ...props }: TreeActionsProps): ReactElement {
	return <View className={treeVariants().actions({ className })} {...props} />;
}
TreeActions.displayName = "DelacourUI.Tree.Actions";
