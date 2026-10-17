import { Children, isValidElement, type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { type AccessibilityActionEvent, View } from "react-native";
import { type IconDefaults, IconDefaultsProvider } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useTreeItemPart, useTreePart } from "./tree.context";
import {
	resolveTreeAccessibility,
	resolveTreeAccessibilityAction,
	resolveTreeForeground,
	resolveTreeIndent,
	resolveTreeRowPress,
	TREE_ROW_INSET,
	treeVariants,
} from "./tree.variants";
import { TreeActions } from "./tree-actions";
import { TreeIndicator } from "./tree-indicator";
import { TreeLabel } from "./tree-label";

export type TreeTriggerProps = Omit<
	PressableProps,
	"asChild" | "children" | "disabled" | "accessibilityActions" | "onAccessibilityAction" | "ref"
> & {
	className?: string;
	children?: ReactNode;
};

/**
 * One node's row: the indicator, the body that is pressed, and any trailing
 * actions.
 *
 * **The row is three siblings, never one `Pressable` holding the others.** The
 * indicator and `Tree.Actions` are lifted out of the children wherever they were
 * written and rendered beside the body, so the indicator always toggles, an
 * action's tap never reaches the row, and an action stays its own element to a
 * screen reader. The body is one accessibility element whose name is its text,
 * announcing `expanded` on a branch, `selected` when the tree selects, and
 * "Level 2" as its value; a branch offers expand or collapse as a custom action.
 *
 * What a press on the body does is `resolveTreeRowPress`: a branch toggles while
 * `expandOnPress` is on, and any row selects while the tree selects. A caller's
 * `onPress` runs after that. With nothing to do, the press has no handler and no
 * haptic.
 *
 * `className` styles the outer row — fill, height, fade; every other prop reaches
 * the `Pressable` body. Bare text is wrapped in a `Tree.Label`, and an indicator
 * is composed in when the children hold none.
 */
export function TreeTrigger({
	feedback = "fade",
	haptic,
	className,
	children,
	onPress,
	accessibilityState,
	...props
}: TreeTriggerProps): ReactElement {
	const tree = useTreePart("Tree.Trigger");
	const item = useTreeItemPart("Tree.Trigger");
	const { isBranch, isDisabled, isExpanded, isSelected, level, select, toggle } = item;

	const slots = treeVariants({ isDisabled, isSelected, size: tree.size });
	const glyphClassName = slots.glyph();

	const press = resolveTreeRowPress({
		expandOnPress: tree.expandOnPress,
		isBranch,
		selectionMode: tree.selectionMode,
	});
	const acts = press.toggle || press.select || onPress !== undefined;

	const handlePress = useCallback(() => {
		if (press.toggle) toggle();
		if (press.select) select();
		onPress?.();
	}, [onPress, press.select, press.toggle, select, toggle]);

	const a11y = resolveTreeAccessibility({
		isBranch,
		isDisabled,
		isExpanded,
		isSelected,
		level,
		selectionMode: tree.selectionMode,
	});

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (resolveTreeAccessibilityAction(event.nativeEvent.actionName, isExpanded)) toggle();
		},
		[isExpanded, toggle]
	);

	const iconDefaults = useMemo<IconDefaults>(
		() => ({ className: glyphClassName, color: resolveTreeForeground({ isSelected }) }),
		[glyphClassName, isSelected]
	);

	const { indicator, body, actions } = useMemo(() => splitChildren(children), [children]);

	return (
		<View
			className={slots.trigger({ className })}
			style={{ paddingStart: TREE_ROW_INSET + resolveTreeIndent(level, tree.indent) }}
		>
			<IconDefaultsProvider value={iconDefaults}>
				{indicator}
				<Pressable
					accessibilityActions={a11y.actions}
					accessibilityRole={a11y.role}
					accessibilityState={{ ...accessibilityState, ...a11y.state }}
					accessibilityValue={a11y.value}
					className={slots.press()}
					disabled={isDisabled}
					feedback={feedback}
					haptic={acts ? (haptic ?? tree.haptic) : false}
					onAccessibilityAction={handleAccessibilityAction}
					onPress={acts ? handlePress : undefined}
					{...props}
				>
					{body}
				</Pressable>
				{actions}
			</IconDefaultsProvider>
		</View>
	);
}
TreeTrigger.displayName = "DelacourUI.Tree.Trigger";

/**
 * Lifts the indicator and any `Tree.Actions` out of a trigger's children, and
 * wraps bare text in a `Tree.Label`.
 *
 * Both are structural — the indicator leads the row, actions trail it, and
 * neither may sit inside the body's `Pressable` — so each is pulled out wherever
 * it was written. An indicator is composed in when there is none, so every row
 * keeps the same column and labels line up across branches and leaves.
 * Consecutive strings and numbers collapse into one label, as `Steps` does.
 */
function splitChildren(children: ReactNode): { indicator: ReactNode; body: ReactNode[]; actions: ReactNode[] } {
	let indicator: ReactNode | null = null;
	const body: ReactNode[] = [];
	const actions: ReactNode[] = [];
	let run: (string | number)[] = [];

	const flushRun = () => {
		if (run.length === 0) return;
		body.push(<TreeLabel key={`label-${body.length}`}>{run.join("")}</TreeLabel>);
		run = [];
	};

	for (const child of Children.toArray(children)) {
		if (typeof child === "string" || typeof child === "number") {
			run.push(child);
			continue;
		}
		flushRun();
		if (indicator === null && isValidElement(child) && child.type === TreeIndicator) {
			indicator = child;
			continue;
		}
		if (isValidElement(child) && child.type === TreeActions) {
			actions.push(child);
			continue;
		}
		body.push(child);
	}
	flushRun();

	return { actions, body, indicator: indicator ?? <TreeIndicator key="indicator" /> };
}
