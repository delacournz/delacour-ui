import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { KeyboardEvents } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useControllableState } from "../../hooks/use-controllable-state";
import { IconMagnifyingGlass } from "../../icons/central";
import { BottomSheet, type BottomSheetProps } from "../bottom-sheet";
import { Button } from "../button";
import { useFieldContext } from "../field/field.context";
import { Icon } from "../icon";
import { Input } from "../input";
import type { InputSize, InputVariant } from "../input/input.variants";
import { playHaptic } from "../pressable";
import { Spinner } from "../spinner";
import { Text } from "../text";
import { collectOptions, findChildOfType } from "./select.collect";
import { type SelectContextValue, SelectProvider } from "./select.context";
import type { SelectListRow, SelectOption, SelectOptionInput, SelectPresentation } from "./select.types";
import {
	buildSelectRows,
	filterGroups,
	normalizeOptions,
	resolveSelectedOptions,
	resolveSelectRowState,
	resolveSelectSheetMaxHeight,
	resolveSelectTriggerText,
	type SelectToggleOptions,
	selectVariants,
	toggleSelection,
	toSelectedValues,
} from "./select.variants";
import { SelectGroup } from "./select-group";
import { SelectItem } from "./select-item";
import { SelectOptionRow } from "./select-option-row";
import { SelectTrigger } from "./select-trigger";

type SelectBaseProps = {
	/** The options as data. Leave it off and compose `Select.Item` / `Select.Group` children instead. */
	options?: readonly SelectOptionInput[];
	/** What the trigger reads while nothing is chosen. */
	placeholder?: string;
	/** The sheet's heading. Defaults to the enclosing `Field.Label`'s text. */
	title?: string;
	/** The trigger's box, as Input names it. */
	variant?: InputVariant;
	/** The trigger's height and type scale, and the rows' metrics. */
	size?: InputSize;
	/** Reports an invalid value. Inherited from an enclosing `Field` when not given. */
	isInvalid?: boolean;
	/** Fades the trigger and stops it opening. Inherited from an enclosing `Field` when not given. */
	isDisabled?: boolean;
	/** Shows the value with a normal look, and never opens. */
	isReadOnly?: boolean;
	/** A spinner replaces the chevron, and an empty sheet shows one too. */
	isLoading?: boolean;
	/** A search field above the rows. Off by default — a long list is the caller's call. */
	isSearchable?: boolean;
	/** The search field's placeholder and accessible name. @default "Search" */
	searchPlaceholder?: string;
	/** What an empty list says — no options, or nothing matching the search. @default "No results" */
	emptyText?: string;
	/** Where the options open. Only `sheet` today. */
	presentation?: SelectPresentation;
	/** Forwarded to the sheet. Leave it off and the sheet sizes to its rows. */
	snapPoints?: BottomSheetProps["snapPoints"];
	/** Custom trigger content for a non-empty selection. */
	renderValue?: (selected: SelectOption[]) => ReactNode;
	/** How many labels a multiple trigger joins before it shows a count. @default 2 */
	maxLabels?: number;
	/** The count a multiple trigger shows past `maxLabels`. @default (n) => `${n} selected` */
	formatSelectedCount?: (count: number) => string;
	/** Classes for the trigger. */
	className?: string;
	/** On the trigger; rows take `${testID}-option-${value}`, search `-search`, close `-close`, Done `-done`. */
	testID?: string;
	/** `Select.Item`, `Select.Group`, and optionally a `Select.Trigger` to replace the default one. */
	children?: ReactNode;
};

export type SelectSingleProps = SelectBaseProps & {
	selectionMode?: "single";
	value?: string | null;
	defaultValue?: string | null;
	onValueChange?: (value: string | null) => void;
	/** A second press on the chosen row clears it. @default false */
	isClearable?: boolean;
};

export type SelectMultipleProps = SelectBaseProps & {
	selectionMode: "multiple";
	value?: readonly string[];
	defaultValue?: readonly string[];
	onValueChange?: (value: string[]) => void;
	/** Once this many are chosen, the remaining rows are disabled. */
	maxSelected?: number;
	/** What a row disabled by `maxSelected` says when it has no description. @default "Limit reached" */
	limitReachedText?: string;
	/** The footer button that closes the sheet. Multiple never closes on a pick. @default "Done" */
	doneText?: string;
};

export type SelectProps = SelectSingleProps | SelectMultipleProps;

const NO_VALUES: readonly string[] = [];

/**
 * The keyboard's height while `isActive`, else zero.
 *
 * Read on the JS thread from the will-show and will-hide events, so the sheet's
 * cap shrinks as the keyboard starts to rise rather than after it lands.
 */
function useKeyboardHeight(isActive: boolean): number {
	const [height, setHeight] = useState(0);

	useEffect(() => {
		if (!isActive) {
			setHeight(0);
			return;
		}
		const show = KeyboardEvents.addListener("keyboardWillShow", (event) => setHeight(event.height));
		const hide = KeyboardEvents.addListener("keyboardWillHide", () => setHeight(0));
		return () => {
			show.remove();
			hide.remove();
		};
	}, [isActive]);

	return height;
}

function SelectRoot(props: SelectProps): ReactElement {
	const {
		options,
		placeholder,
		title,
		variant = "primary",
		size = "md",
		isInvalid,
		isDisabled,
		isReadOnly = false,
		isLoading = false,
		isSearchable = false,
		searchPlaceholder = "Search",
		emptyText = "No results",
		snapPoints,
		renderValue,
		maxLabels,
		formatSelectedCount,
		className,
		testID,
		children,
	} = props;
	const mode = props.selectionMode ?? "single";
	const multiple = props.selectionMode === "multiple" ? props : null;
	const single = props.selectionMode === "multiple" ? null : props;

	const field = useFieldContext();
	const { height: windowHeight } = useWindowDimensions();
	const { top: topInset } = useSafeAreaInsets();
	const resolvedIsInvalid = isInvalid ?? field?.isInvalid ?? false;
	const resolvedIsDisabled = isDisabled ?? field?.isDisabled ?? false;

	// Rows come from data, never from live children: the declarative form is
	// read into the same shape the `options` prop takes, so search can filter it
	// and a virtualised list can recycle it.
	const entries = useMemo(() => normalizeOptions(options ?? collectOptions(children)), [options, children]);
	const customTrigger = findChildOfType(children, SelectTrigger);

	// Inside, a selection is always a list — empty or one long in single mode —
	// and it is turned back into the mode's own shape only on the way out.
	const controlled = useMemo(() => toSelectedValues(props.value), [props.value]);
	const [selected, setSelected] = useControllableState<readonly string[]>({
		defaultValue: toSelectedValues(props.defaultValue) ?? NO_VALUES,
		onChange: (next) => {
			if (props.selectionMode === "multiple") props.onValueChange?.([...next]);
			else props.onValueChange?.(next[0] ?? null);
		},
		value: controlled,
	});

	const [isOpen, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const keyboardHeight = useKeyboardHeight(isOpen && isSearchable);
	const canOpen = !resolvedIsDisabled && !isReadOnly;

	const open = useCallback(() => {
		if (canOpen) setOpen(true);
	}, [canOpen]);

	// One path for every close — a pick, Done, a swipe, the overlay, the close
	// button — and each one clears the search, so the next open starts whole.
	const handleOpenChange = useCallback((next: boolean) => {
		setOpen(next);
		if (!next) setQuery("");
	}, []);
	const close = useCallback(() => handleOpenChange(false), [handleOpenChange]);

	const maxSelected = multiple?.maxSelected;
	const isClearable = single?.isClearable ?? false;
	const toggleOptions: SelectToggleOptions =
		mode === "multiple" ? { max: maxSelected, mode: "multiple" } : { isClearable, mode: "single" };

	const toggle = (value: string) => {
		const result = toggleSelection(selected, value, toggleOptions);
		if (result.change === "blocked" || result.change === "limit-reached") playHaptic("warning");
		if (result.change !== "unchanged" && result.change !== "blocked") setSelected(result.selected);
		if (mode === "single") close();
	};

	// Offered to an enclosing `Field`, so tapping its label opens the sheet the
	// way tapping a text field's label focuses it.
	const registerPress = field?.registerPress;
	useEffect(() => {
		if (!registerPress) return;
		registerPress(open);
		return () => registerPress(null);
	}, [open, registerPress]);

	const selectedOptions = useMemo(() => resolveSelectedOptions(entries, selected), [entries, selected]);
	const triggerText = resolveSelectTriggerText({ entries, formatSelectedCount, maxLabels, mode, selected });
	const sheetTitle = title ?? field?.label ?? undefined;

	const context: SelectContextValue = {
		accessibilityLabel: field?.label ?? title,
		close,
		isDisabled: resolvedIsDisabled,
		isInvalid: resolvedIsInvalid,
		isLoading,
		isOpen,
		isReadOnly,
		open,
		placeholder,
		renderValue,
		selectedOptions,
		selectedValues: selected,
		selectionMode: mode,
		size,
		testID,
		toggle,
		triggerText,
		variant,
	};

	const rows = buildSelectRows(isSearchable ? filterGroups(entries, query) : entries);
	const slots = selectVariants({ size, variant });

	const renderRow = ({ item }: { item: SelectListRow }): ReactElement => {
		if (item.kind === "heading") {
			return (
				<Text.Overline accessibilityRole="header" className={slots.groupHeading()} color="muted">
					{item.label}
				</Text.Overline>
			);
		}
		const isSelected = selected.includes(item.option.value);
		const state = resolveSelectRowState({
			isSelected,
			maxSelected,
			option: item.option,
			selectedCount: selected.length,
		});
		const limitDescription =
			state.isDisabled && state.reason === "limit" && !item.option.description
				? (multiple?.limitReachedText ?? "Limit reached")
				: undefined;

		return (
			<SelectOptionRow
				description={limitDescription}
				isDisabled={state.isDisabled}
				isSelected={isSelected}
				mode={mode}
				onPress={toggle}
				option={item.option}
				size={size}
				testID={testID ? `${testID}-option-${item.option.value}` : undefined}
			/>
		);
	};

	// The title and the search field ride at the head of the list rather than
	// above it, so they count towards the height the sheet sizes itself to.
	const header = (
		<View className={slots.header()}>
			<BottomSheet.Close testID={testID ? `${testID}-close` : undefined} />
			{sheetTitle ? <BottomSheet.Title>{sheetTitle}</BottomSheet.Title> : null}
			{isSearchable ? (
				<Input.Group size={size}>
					<Input.Group.Prefix>
						<Icon icon={IconMagnifyingGlass} />
					</Input.Group.Prefix>
					<BottomSheet.TextInput
						accessibilityLabel={searchPlaceholder}
						autoCapitalize="none"
						autoCorrect={false}
						onChangeText={setQuery}
						placeholder={searchPlaceholder}
						returnKeyType="search"
						testID={testID ? `${testID}-search` : undefined}
						value={query}
					/>
				</Input.Group>
			) : null}
		</View>
	);

	const empty = (
		<View className={slots.empty()}>
			{isLoading && entries.length === 0 ? (
				<Spinner color="muted-foreground" />
			) : (
				<Text accessibilityLiveRegion="polite" color="muted">
					{emptyText}
				</Text>
			)}
		</View>
	);

	return (
		<SelectProvider value={context}>
			{customTrigger ?? <SelectTrigger className={className} />}
			<BottomSheet
				dynamicSizing={snapPoints === undefined}
				isOpen={isOpen}
				maxDynamicContentSize={resolveSelectSheetMaxHeight({ keyboardHeight, topInset, windowHeight })}
				onOpenChange={handleOpenChange}
				snapPoints={snapPoints}
			>
				<BottomSheet.Portal>
					<BottomSheet.Overlay />
					<BottomSheet.Container>
						<BottomSheet.FlatList
							contentContainerClassName={slots.sheetBody()}
							data={rows}
							extraData={selected}
							keyboardShouldPersistTaps="handled"
							keyExtractor={(row) => row.key}
							ListEmptyComponent={empty}
							ListHeaderComponent={header}
							renderItem={renderRow}
						/>
						{multiple ? (
							<BottomSheet.Footer sticky>
								<Button onPress={close} testID={testID ? `${testID}-done` : undefined}>
									{multiple.doneText ?? "Done"}
								</Button>
							</BottomSheet.Footer>
						) : null}
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</SelectProvider>
	);
}

/**
 * A closed set of choices behind a field-shaped trigger, picked from a bottom
 * sheet.
 *
 * Single selection by default — a pick closes the sheet. `selectionMode="multiple"`
 * keeps it open, draws a box on each row, and closes from a Done footer;
 * `onValueChange` hands back an array there and a string or `null` in single
 * mode, and the types follow the mode.
 *
 * Options come as data through `options`, or as `Select.Item` and `Select.Group`
 * children. Either way the rows are drawn from one normalised list, so search
 * filters them and the list is virtualised. Inside a `Field` the select takes
 * its invalid and disabled state, reads its label as its accessible name and
 * sheet title, and opens when the label is tapped.
 *
 * The sheet engine is an optional peer: an app using `Select` installs
 * `@delacour/react-native-bottom-sheet` and mounts `BottomSheetProvider` once.
 *
 * @example
 * <Field>
 *   <Field.Label>Country</Field.Label>
 *   <Select onValueChange={setCountry} placeholder="Choose" value={country}>
 *     <Select.Group label="Oceania">
 *       <Select.Item label="New Zealand" value="nz" />
 *       <Select.Item description="Includes territories" label="Australia" value="au" />
 *     </Select.Group>
 *   </Select>
 * </Field>
 *
 * @example
 * <Select onValueChange={setTags} options={tags} selectionMode="multiple" value={selected} />
 */
export const Select = Object.assign(SelectRoot, {
	/** One option, declared as a child. Renders nothing; the root reads its props. */
	Item: SelectItem,
	/** A titled run of `Select.Item`s. A search that empties it hides its heading. */
	Group: SelectGroup,
	/** The control that opens the sheet. Compose it only to replace the default one. */
	Trigger: SelectTrigger,
	displayName: "DelacourUI.Select",
});
