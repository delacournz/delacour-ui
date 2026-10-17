import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { useTreeItemPart, useTreePart } from "./tree.context";
import { TREE_LABEL_TEXT_SIZE, treeVariants } from "./tree.variants";

export type TreeLabelProps = TextPresetProps;

/**
 * The node's name — and, because the row is one accessibility element, its
 * accessible name too.
 *
 * Renders `Text.Label` at the tree's own size step, on one line by default: a
 * tree is scanned down its start edge, and a name that wraps pushes every row
 * below it out of rhythm. Its colour follows the selection. Bare text inside a
 * `Tree.Trigger` is wrapped in one automatically.
 */
export function TreeLabel({ className, size, numberOfLines = 1, ...props }: TreeLabelProps): ReactElement {
	const tree = useTreePart("Tree.Label");
	const item = useTreeItemPart("Tree.Label");

	return (
		<Text.Label
			className={treeVariants({ isSelected: item.isSelected }).label({ className })}
			numberOfLines={numberOfLines}
			size={size ?? TREE_LABEL_TEXT_SIZE[tree.size]}
			{...props}
		/>
	);
}
TreeLabel.displayName = "DelacourUI.Tree.Label";
