import { type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import type { HapticFeedback } from "../pressable/pressable";
import { type TreeContextValue, TreeProvider } from "./tree.context";
import {
	isNodeSelected,
	resolveSelection,
	TREE_DEFAULT_INDENT,
	TREE_DEFAULT_SIZE,
	type TreeSelectionState,
	type TreeSize,
	toggleExpanded,
	treeVariants,
} from "./tree.variants";
import { TreeActions } from "./tree-actions";
import { TreeGroup } from "./tree-group";
import { TreeIcon } from "./tree-icon";
import { TreeIndicator } from "./tree-indicator";
import { TreeItem } from "./tree-item";
import { TreeLabel } from "./tree-label";
import { TreeTrigger } from "./tree-trigger";

/**
 * Whether, and how, the tree selects — and the value that goes with it.
 *
 * A union so `single` is only ever handed a string and `multiple` only an array.
 * `none` declares the three keys as `never` so a caller cannot pass a value to a
 * tree that will never read it.
 */
export type TreeSelection =
	| { selectionMode?: "none"; value?: never; defaultValue?: never; onValueChange?: never }
	| {
			selectionMode: "single";
			value?: string | null;
			defaultValue?: string | null;
			/** Called with the pressed node. A re-press keeps it selected, so this is not called again. */
			onValueChange?: (value: string | null) => void;
	  }
	| {
			selectionMode: "multiple";
			value?: readonly string[];
			defaultValue?: readonly string[];
			/** Called with the whole selection after a press adds or removes one node. */
			onValueChange?: (value: string[]) => void;
	  };

/** What `onExpandedChange` is told besides the new list. */
export type TreeExpandedChangeDetails = { value: string; isExpanded: boolean };

export type TreeProps = Omit<ViewProps, "children"> &
	TreeSelection & {
		/** `sm` rows are 36 points, `md` 44. */
		size?: TreeSize;
		/** The open branches. Controlled. */
		expanded?: readonly string[];
		/** The branches open at first while uncontrolled. */
		defaultExpanded?: readonly string[];
		/** Called with every open branch after one opens or closes, and which one it was. */
		onExpandedChange?: (expanded: string[], details: TreeExpandedChangeDetails) => void;
		/** Pressing a branch's row, not just its indicator, opens and closes it. Default true. */
		expandOnPress?: boolean;
		/** Hairline guides from a branch down to its children. */
		hasLines?: boolean;
		/** Points per nesting level. Default 16. */
		indent?: number;
		/** Disables every node, overriding a node's own `isDisabled`. */
		isDisabled?: boolean;
		/** The haptic a row or indicator plays on press. Default `selection`; `false` for none. */
		haptic?: false | HapticFeedback;
		className?: string;
		children?: ReactNode;
	};

const EMPTY: readonly string[] = [];

function TreeRoot(props: TreeProps): ReactElement {
	const {
		selectionMode = "none",
		value: _value,
		defaultValue: _defaultValue,
		onValueChange: _onValueChange,
		size = TREE_DEFAULT_SIZE,
		expanded: expandedProp,
		defaultExpanded = EMPTY,
		onExpandedChange,
		expandOnPress = true,
		hasLines = false,
		indent = TREE_DEFAULT_INDENT,
		isDisabled,
		haptic = "selection",
		className,
		children,
		...viewProps
	} = props;

	// Narrowed off the props object rather than the destructured names, which
	// lose the link between `selectionMode` and the value's type.
	const single = props.selectionMode === "single" ? props : undefined;
	const multiple = props.selectionMode === "multiple" ? props : undefined;
	const onMultipleChange = multiple?.onValueChange;

	const [singleValue, setSingleValue] = useControllableState<string | null>({
		value: single?.value,
		defaultValue: single?.defaultValue ?? null,
		onChange: single?.onValueChange,
	});

	const reportMultiple = useCallback((next: readonly string[]) => onMultipleChange?.([...next]), [onMultipleChange]);
	const [multipleValue, setMultipleValue] = useControllableState<readonly string[]>({
		value: multiple?.value,
		defaultValue: multiple?.defaultValue ?? EMPTY,
		onChange: reportMultiple,
	});

	const [expanded, setExpanded] = useControllableState<readonly string[]>({
		value: expandedProp,
		defaultValue: defaultExpanded,
	});

	const selection = useMemo<TreeSelectionState>(() => {
		if (selectionMode === "single") return { mode: "single", value: singleValue };
		if (selectionMode === "multiple") return { mode: "multiple", value: multipleValue };
		return { mode: "none" };
	}, [multipleValue, selectionMode, singleValue]);

	const select = useCallback(
		(node: string) => {
			const next = resolveSelection(selection, node);
			if (next.mode === "single" && next.value !== singleValue) setSingleValue(next.value);
			if (next.mode === "multiple") setMultipleValue(next.value);
		},
		[selection, setMultipleValue, setSingleValue, singleValue]
	);

	const toggle = useCallback(
		(node: string) => {
			const next = toggleExpanded(expanded, node);
			setExpanded(next);
			onExpandedChange?.(next, { isExpanded: next.includes(node), value: node });
		},
		[expanded, onExpandedChange, setExpanded]
	);

	const isExpanded = useCallback((node: string) => expanded.includes(node), [expanded]);
	const isSelected = useCallback((node: string) => isNodeSelected(selection, node), [selection]);

	const context = useMemo<TreeContextValue>(
		() => ({
			expandOnPress,
			hasLines,
			haptic,
			indent,
			isDisabled,
			isExpanded,
			isSelected,
			select,
			selectionMode,
			size,
			toggle,
		}),
		[expandOnPress, hasLines, haptic, indent, isDisabled, isExpanded, isSelected, select, selectionMode, size, toggle]
	);

	return (
		<TreeProvider value={context}>
			<View accessibilityRole="list" className={treeVariants({ size }).root({ className })} {...viewProps}>
				{children}
			</View>
		</TreeProvider>
	);
}

/**
 * A hierarchy opened one level at a time — a file browser, nested settings, a
 * category picker, a table of contents.
 *
 * Expansion and selection are independent. Branches open from their chevron
 * always, and from the whole row unless `expandOnPress={false}`;
 * `selectionMode` adds `single` or `multiple` selection on top. Both are
 * controlled or uncontrolled. A closed branch's children are unmounted, and a
 * node knows its depth from the groups it sits in.
 *
 * @example
 * <Tree selectionMode="single" value={selected} onValueChange={setSelected} hasLines>
 *   <Tree.Item value="src">
 *     <Tree.Trigger>
 *       <Tree.Icon><Icon icon={IconFolder1} /></Tree.Icon>
 *       <Tree.Label>src</Tree.Label>
 *       <Tree.Actions><Badge>3</Badge></Tree.Actions>
 *     </Tree.Trigger>
 *     <Tree.Group>
 *       <Tree.Item value="src/index.ts">
 *         <Tree.Trigger>index.ts</Tree.Trigger>
 *       </Tree.Item>
 *     </Tree.Group>
 *   </Tree.Item>
 * </Tree>
 */
export const Tree = Object.assign(TreeRoot, {
	/** One node — its row and, while open, its group. */
	Item: TreeItem,
	/** The node's row. Bare text becomes a label; an indicator is composed in. */
	Trigger: TreeTrigger,
	/** The chevron. Always toggles; a same-width spacer on a leaf. */
	Indicator: TreeIndicator,
	/** The node's leading glyph, inheriting the row's size and colour. */
	Icon: TreeIcon,
	/** The node's name, on one line. */
	Label: TreeLabel,
	/** Trailing content, outside the row's tap target. */
	Actions: TreeActions,
	/** A branch's children, mounted only while it is open. */
	Group: TreeGroup,
	displayName: "DelacourUI.Tree",
});
