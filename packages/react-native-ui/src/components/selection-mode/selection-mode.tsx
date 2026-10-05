import { type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { type HapticFeedback, playHaptic } from "../pressable/pressable";
import { type SelectionModeContextValue, SelectionModeProvider } from "./selection-mode.context";
import {
	resolveIsAllSelected,
	resolveIsSameSelection,
	resolveSelectAll,
	resolveToggle,
	selectionModeVariants,
} from "./selection-mode.variants";
import { SelectionModeAction } from "./selection-mode-action";
import { SelectionModeBar } from "./selection-mode-bar";
import { SelectionModeGroup } from "./selection-mode-group";
import { SelectionModeHeader } from "./selection-mode-header";
import { SelectionModeIndicator } from "./selection-mode-indicator";
import { SelectionModeItem } from "./selection-mode-item";

export type SelectionModeProps = ViewProps & {
	children: ReactNode;
	className?: string;
	/** Every pickable id, in list order — what select-all picks and "n of m" counts. */
	values?: readonly string[];
	/** Whether the mode is on. Controlled. */
	isActive?: boolean;
	/** Whether the mode starts on, while uncontrolled. */
	defaultActive?: boolean;
	onActiveChange?: (isActive: boolean) => void;
	/** The picked ids, in the order they were picked. Controlled. */
	selected?: readonly string[];
	/** The ids picked to begin with, while uncontrolled. */
	defaultSelected?: readonly string[];
	/** Called with the whole new list. Never called for a change that changes nothing. */
	onSelectedChange?: (selected: string[]) => void;
	/** The most ids that can be picked. Select-all stops here too. */
	max?: number;
	/** Played on entering the mode and on every toggle. Off by default. */
	haptic?: false | HapticFeedback;
};

function SelectionModeRoot({
	children,
	className,
	values,
	isActive,
	defaultActive = false,
	onActiveChange,
	selected,
	defaultSelected = EMPTY,
	onSelectedChange,
	max,
	haptic = false,
	...props
}: SelectionModeProps): ReactElement {
	const [active, setActive] = useControllableState<boolean>({
		defaultValue: defaultActive,
		onChange: onActiveChange,
		value: isActive,
	});
	const [picked, setPicked] = useControllableState<readonly string[]>({
		defaultValue: defaultSelected,
		onChange: onSelectedChange as ((next: readonly string[]) => void) | undefined,
		value: selected,
	});
	const isSelectedControlled = selected !== undefined;

	const commit = useCallback(
		(next: string[]): boolean => {
			if (resolveIsSameSelection(next, picked)) return false;
			setPicked(next);
			return true;
		},
		[picked, setPicked]
	);

	const toggle = useCallback(
		(value: string) => {
			if (commit(resolveToggle({ max, selected: picked, value })) && haptic) playHaptic(haptic);
		},
		[commit, haptic, max, picked]
	);

	const enter = useCallback(
		(value?: string) => {
			if (!active) setActive(true);
			const didPick =
				value !== undefined && !picked.includes(value) && commit(resolveToggle({ max, selected: picked, value }));
			if (haptic && (!active || didPick)) playHaptic(haptic);
		},
		[active, commit, haptic, max, picked, setActive]
	);

	const exit = useCallback(() => {
		if (active) setActive(false);
		if (!isSelectedControlled) commit([]);
	}, [active, commit, isSelectedControlled, setActive]);

	const selectAll = useCallback(() => {
		commit(resolveSelectAll({ max, selected: picked, values: values ?? EMPTY }));
	}, [commit, max, picked, values]);

	const clear = useCallback(() => {
		commit([]);
	}, [commit]);

	const isSelected = useCallback((value: string) => picked.includes(value), [picked]);

	const context = useMemo<SelectionModeContextValue>(
		() => ({
			clear,
			count: picked.length,
			enter,
			exit,
			haptic,
			isActive: active,
			isAllSelected: resolveIsAllSelected({ max, selected: picked, values: values ?? EMPTY }),
			isSelected,
			max,
			selectAll,
			selected: [...picked],
			toggle,
			total: values?.length,
		}),
		[active, clear, enter, exit, haptic, isSelected, max, picked, selectAll, toggle, values]
	);

	return (
		<SelectionModeProvider value={context}>
			<View className={selectionModeVariants().root({ className })} {...props}>
				{children}
			</View>
		</SelectionModeProvider>
	);
}

/**
 * A stable empty list, so an uncontrolled selection does not seed its state
 * from a fresh array on every render.
 */
const EMPTY: readonly string[] = [];

/**
 * Pick several things at once, then act on them from a bar.
 *
 * A mode: off, the list is for reading and each item keeps its own press; a
 * long press on an item turns the mode on with that item picked. On, a press
 * toggles, `SelectionMode.Header` says so and offers the way out, and
 * `SelectionMode.Bar` rises over the bottom edge with the actions.
 *
 * Selection is a set of ids — a `string[]` in the order things were picked,
 * never indices — controlled with `selected` + `onSelectedChange` or held from
 * `defaultSelected`. The mode is `isActive` + `onActiveChange`, or
 * `defaultActive`. Exiting clears an uncontrolled selection; a controlled one is
 * left to the caller. `values` lists every pickable id, which is what
 * select-all and the "n of m" count need. `max` caps both toggling and
 * select-all.
 *
 * The root fills the height it is offered (`flex-1`), so give it one. The bar is
 * absolute, over the list, so pad the bottom of the list (`pb-24`) for the last
 * row to scroll clear of it.
 *
 * @example
 * <SelectionMode onSelectedChange={setSelected} selected={selected} values={ids}>
 *   <SelectionMode.Header title="Choose" />
 *   <FlatList
 *     contentContainerClassName="pb-24"
 *     data={messages}
 *     renderItem={({ item }) => (
 *       <SelectionMode.Item onPress={() => open(item)} value={item.id}>
 *         <Item>…</Item>
 *       </SelectionMode.Item>
 *     )}
 *   />
 *   <SelectionMode.Bar>
 *     <SelectionMode.Action icon={IconTrashCan} isDestructive isExitOnPress onPress={remove}>
 *       Delete
 *     </SelectionMode.Action>
 *   </SelectionMode.Bar>
 * </SelectionMode>
 *
 * @example
 * <SelectionMode defaultActive values={swatches}>
 *   <SelectionMode.Group columns={5}>
 *     {swatches.map((swatch) => (
 *       <SelectionMode.Item indicator="ring" key={swatch} ringClassName="rounded-full" value={swatch}>
 *         <Swatch color={swatch} />
 *       </SelectionMode.Item>
 *     ))}
 *   </SelectionMode.Group>
 * </SelectionMode>
 */
export const SelectionMode = Object.assign(SelectionModeRoot, {
	/** One pickable thing. Wraps whatever it holds. */
	Item: SelectionModeItem,
	/** The round picked mark, for an item that places its own. */
	Indicator: SelectionModeIndicator,
	/** Shown while the mode is on: close, the count and select-all. */
	Header: SelectionModeHeader,
	/** The actions, over the bottom edge, while something is picked. */
	Bar: SelectionModeBar,
	/** One action in the bar: an icon over a label. */
	Action: SelectionModeAction,
	/** Lays items out as a stacked card, a grid or a horizontal strip. */
	Group: SelectionModeGroup,
	displayName: "DelacourUI.SelectionMode",
});
