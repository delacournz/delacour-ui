import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { TreeLevelProvider, useTreeItemPart, useTreePart } from "./tree.context";
import { resolveTreeLineOffset, TREE_GROUP_FADE_MS, treeVariants } from "./tree.variants";

export type TreeGroupProps = Omit<ViewProps, "style"> & {
	className?: string;
	children?: ReactNode;
};

const ENTERING = FadeIn.duration(TREE_GROUP_FADE_MS);

/**
 * The children of a branch.
 *
 * **Rendered only while its item is open — a closed group unmounts.** A tree of a
 * few hundred nodes would otherwise hold every row of every closed folder in
 * memory and in the layout pass. Expansion state lives on the root, so nothing is
 * lost: reopening a folder restores whatever was open inside it. Its presence
 * among an item's direct children is also what marks that item a branch.
 *
 * Its items read one level deeper from it, which is all the recursion a tree
 * needs — a group inside an item inside a group is level 3 without anyone
 * counting.
 *
 * Fades in on open; the rows below make room through the items' layout
 * transition. Both are dropped under reduce motion. With `hasLines`, a hairline
 * runs down its start edge under the branch's indicator, hidden from assistive
 * technology.
 */
export function TreeGroup({ className, children, ...props }: TreeGroupProps): ReactElement | null {
	const { hasLines, indent, size } = useTreePart("Tree.Group");
	const { isExpanded, level } = useTreeItemPart("Tree.Group");
	const isReducedMotion = useReducedMotion();
	const slots = treeVariants({ size });

	if (!isExpanded) return null;

	return (
		<TreeLevelProvider value={level}>
			<Animated.View
				className={slots.group({ className })}
				entering={isReducedMotion ? undefined : ENTERING}
				{...props}
			>
				{children}
				{hasLines ? (
					<View
						accessibilityElementsHidden
						className={slots.line()}
						importantForAccessibility="no-hide-descendants"
						pointerEvents="none"
						style={{ start: resolveTreeLineOffset({ indent, level, size }) }}
					/>
				) : null}
			</Animated.View>
		</TreeLevelProvider>
	);
}
TreeGroup.displayName = "DelacourUI.Tree.Group";
