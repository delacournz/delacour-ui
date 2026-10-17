import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { HapticFeedback } from "../pressable/pressable";
import type { TreeSelectionMode, TreeSize } from "./tree.variants";

export type TreeContextValue = {
	size: TreeSize;
	selectionMode: TreeSelectionMode;
	/** Points per nesting level. */
	indent: number;
	/** Draw a hairline guide down every open group. */
	hasLines: boolean;
	/** Pressing a branch's row, not just its indicator, opens and closes it. */
	expandOnPress: boolean;
	haptic: false | HapticFeedback;
	/** Raw rather than resolved, so one item can still disable itself — see `resolveTreeDisabled`. */
	isDisabled?: boolean;
	isExpanded: (value: string) => boolean;
	isSelected: (value: string) => boolean;
	/** Opens a closed branch or closes an open one. */
	toggle: (value: string) => void;
	/** Applies a press to the selection — `single` replaces, `multiple` toggles, `none` ignores. */
	select: (value: string) => void;
};

export type TreeItemContextValue = {
	value: string;
	/** One-based depth: a top-level item is level 1. */
	level: number;
	/** Has a `Tree.Group` among its direct children, or was marked `hasChildren`. */
	isBranch: boolean;
	isExpanded: boolean;
	isSelected: boolean;
	isDisabled: boolean;
	/** Opens or closes this item. Ignored on a leaf and while disabled. */
	toggle: () => void;
	/** Selects this item, by the tree's mode. Ignored while disabled. */
	select: () => void;
};

const TreeContext = createContext<TreeContextValue | null>(null);
const TreeItemContext = createContext<TreeItemContextValue | null>(null);

/**
 * The level of the nearest enclosing group's item — `0` at the root, so a
 * top-level item reads `0 + 1`. Each `Tree.Group` re-provides its own item's
 * level, which is all a recursive tree needs to know its depth.
 */
const TreeLevelContext = createContext(0);

/**
 * Supplies the tree's state and axes to its items.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./tree` — which would close a cycle and leave the
 * context `undefined` on a cold start. See AGENTS.md rule 3.
 */
export function TreeProvider({ value, children }: { value: TreeContextValue; children: ReactNode }): ReactElement {
	return <TreeContext value={value}>{children}</TreeContext>;
}
TreeProvider.displayName = "DelacourUI.Tree.Provider";

/** Supplies one item's settled state to its trigger, indicator, label and group. */
export function TreeItemProvider({
	value,
	children,
}: {
	value: TreeItemContextValue;
	children: ReactNode;
}): ReactElement {
	return <TreeItemContext value={value}>{children}</TreeItemContext>;
}
TreeItemProvider.displayName = "DelacourUI.Tree.Item.Provider";

/** Supplies the depth a group's children are nested under. */
export function TreeLevelProvider({ value, children }: { value: number; children: ReactNode }): ReactElement {
	return <TreeLevelContext value={value}>{children}</TreeLevelContext>;
}
TreeLevelProvider.displayName = "DelacourUI.Tree.LevelProvider";

/** The level of the item whose group encloses the caller — `0` directly under the root. */
export function useTreeParentLevel(): number {
	return use(TreeLevelContext);
}

/** The enclosing tree's context, or null outside a `<Tree>`. */
export function useTreeContext(): TreeContextValue | null {
	return use(TreeContext);
}

/**
 * Reads the enclosing tree's state and axes.
 *
 * For a custom control — an "expand all" button, a selection summary — that has
 * to follow the tree it sits in. Throws outside one.
 */
export function useTree(): TreeContextValue {
	const context = useTreeContext();
	if (!context) {
		throw new Error("useTree must be called inside a <Tree>.");
	}
	return context;
}

/** The enclosing item's settled state, or null outside a `<Tree.Item>`. */
export function useTreeItemContext(): TreeItemContextValue | null {
	return use(TreeItemContext);
}

/**
 * Reads the enclosing item's settled state.
 *
 * Lets a custom child — a folder glyph that opens with its branch, a spinner while
 * a lazy branch loads — style itself to match. Throws outside a `<Tree.Item>`.
 */
export function useTreeItem(): TreeItemContextValue {
	const context = useTreeItemContext();
	if (!context) {
		throw new Error("useTreeItem must be called inside a <Tree.Item>.");
	}
	return context;
}

/**
 * The enclosing tree, for a part that cannot work without one.
 *
 * Internal: not re-exported from `index.ts`. A caller wants {@link useTree},
 * whose error names the hook rather than a part.
 */
export function useTreePart(component: string): TreeContextValue {
	const context = useTreeContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Tree>.`);
	}
	return context;
}

/** The enclosing item, for a part that cannot work without one. Internal. */
export function useTreeItemPart(component: string): TreeItemContextValue {
	const context = useTreeItemContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Tree.Item>.`);
	}
	return context;
}
