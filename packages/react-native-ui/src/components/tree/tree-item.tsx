import { Children, isValidElement, type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import type { ViewProps } from "react-native";
import Animated, { LinearTransition, useReducedMotion } from "react-native-reanimated";
import { type TreeItemContextValue, TreeItemProvider, useTreeParentLevel, useTreePart } from "./tree.context";
import { resolveTreeDisabled, TREE_SPRING, treeVariants } from "./tree.variants";
import { TreeGroup } from "./tree-group";

export type TreeItemProps = Omit<ViewProps, "style"> & {
	/** Identifies the node in `value`, `expanded` and every callback. Unique across the tree. */
	value: string;
	/** The node cannot be pressed, toggled or selected, and fades. A tree that names `isDisabled` wins over this. */
	isDisabled?: boolean;
	/**
	 * Marks the node a branch before its `Tree.Group` is rendered — for lazy
	 * loading, where the children are fetched when it first opens. The indicator
	 * shows, and the node announces `expanded`, from the start.
	 */
	hasChildren?: boolean;
	className?: string;
	children?: ReactNode;
};

const LAYOUT = LinearTransition.springify()
	.damping(TREE_SPRING.damping)
	.mass(TREE_SPRING.mass)
	.stiffness(TREE_SPRING.stiffness);

/**
 * One node: its `Tree.Trigger` row and, while it is open, its `Tree.Group`.
 *
 * **It is a branch when a `Tree.Group` is among its direct children**, or when it
 * says so with `hasChildren`. The children are walked the way `Steps` counts its
 * items, so a group behind a wrapper component of the caller's own is not seen —
 * pass `hasChildren` then.
 *
 * Its depth is the enclosing group's plus one, read from context, so items nest
 * by being written inside each other and never take a `level` prop.
 *
 * Slides into place on `Collapsible`'s spring when a group above it opens or
 * closes — snapped under reduce motion.
 */
export function TreeItem({
	value,
	isDisabled,
	hasChildren = false,
	className,
	children,
	...props
}: TreeItemProps): ReactElement {
	const tree = useTreePart("Tree.Item");
	const level = useTreeParentLevel() + 1;
	const isReducedMotion = useReducedMotion();

	const hasGroup = useMemo(
		() => Children.toArray(children).some((child) => isValidElement(child) && child.type === TreeGroup),
		[children]
	);
	const isBranch = hasChildren || hasGroup;
	const resolvedIsDisabled = resolveTreeDisabled(tree.isDisabled, isDisabled);
	const isExpanded = isBranch && tree.isExpanded(value);
	const isSelected = tree.isSelected(value);

	const { toggle: toggleTree, select: selectTree } = tree;

	const toggle = useCallback(() => {
		if (isBranch && !resolvedIsDisabled) toggleTree(value);
	}, [isBranch, resolvedIsDisabled, toggleTree, value]);

	const select = useCallback(() => {
		if (!resolvedIsDisabled) selectTree(value);
	}, [resolvedIsDisabled, selectTree, value]);

	const context = useMemo<TreeItemContextValue>(
		() => ({ isBranch, isDisabled: resolvedIsDisabled, isExpanded, isSelected, level, select, toggle, value }),
		[isBranch, resolvedIsDisabled, isExpanded, isSelected, level, select, toggle, value]
	);

	return (
		<TreeItemProvider value={context}>
			<Animated.View
				className={treeVariants().item({ className })}
				layout={isReducedMotion ? undefined : LAYOUT}
				{...props}
			>
				{children}
			</Animated.View>
		</TreeItemProvider>
	);
}
TreeItem.displayName = "DelacourUI.Tree.Item";
