import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	AccessibilityInfo,
	Platform,
	type TextInputInstance,
	type TextInputKeyPressEvent,
	useWindowDimensions,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useControllableState } from "../../hooks/use-controllable-state";
import { IconCrossSmall, IconMagnifyingGlass } from "../../icons/central";
import { BottomSheet, type BottomSheetProps } from "../bottom-sheet";
import { Button } from "../button";
import type { ChipVariant } from "../chip/chip.variants";
import { useFieldContext } from "../field/field.context";
import { Icon } from "../icon";
import { Input } from "../input";
import type { InputSize, InputVariant } from "../input/input.variants";
import { Pressable, playHaptic } from "../pressable";
import { findChildOfType } from "../select/select.collect";
import type { SelectOption } from "../select/select.types";
import {
	resolveSelectRowState,
	type SelectToggleOptions,
	selectVariants,
	toggleSelection,
	toSelectedValues,
} from "../select/select.variants";
import { SelectOptionRow } from "../select/select-option-row";
import { Spinner } from "../spinner";
import { Text } from "../text";
import { collectComboboxOptions } from "./combobox.collect";
import { type ComboboxContextValue, ComboboxProvider } from "./combobox.context";
import {
	buildComboboxRows,
	type ComboboxPendingRemoveState,
	filterItems,
	getHighlightRanges,
	normalizeComboboxOptions,
	resolvePendingRemove,
	resolveQueryReset,
	resolveResultsAnnouncement,
	resolveSelectedComboboxOptions,
	shouldOfferCreate,
} from "./combobox.filter";
import type {
	ComboboxFilter,
	ComboboxInputChangeReason,
	ComboboxListRow,
	ComboboxOptionInput,
	ComboboxPresentation,
} from "./combobox.types";
import { comboboxVariants, resolveComboboxSheetHeight, resolveComboboxTriggerText } from "./combobox.variants";
import { ComboboxChipRow } from "./combobox-chip-row";
import { ComboboxCreateRow } from "./combobox-create-row";
import { ComboboxEmpty } from "./combobox-empty";
import { ComboboxGroup } from "./combobox-group";
import { ComboboxItem } from "./combobox-item";
import { ComboboxTrigger } from "./combobox-trigger";

type ComboboxBaseProps = {
	/** The options as data. Leave it off and compose `Combobox.Item` / `Combobox.Group` children instead. */
	options?: readonly ComboboxOptionInput[];
	/** The query, controlled. Pair it with `onInputValueChange`. */
	inputValue?: string;
	/** The query to start from while uncontrolled. */
	defaultInputValue?: string;
	/** Every change to the query, with why: typed, or emptied by a pick, the clear button or a close. */
	onInputValueChange?: (query: string, reason: ComboboxInputChangeReason) => void;
	/** How the list answers the query. `{ kind: "none" }` for a server that does the matching. @default { kind: "default" } */
	filter?: ComboboxFilter;
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
	/** Shows the value — chips without remove buttons — and never opens. */
	isReadOnly?: boolean;
	/** A spinner in the search field and on the trigger; an empty list shows one in place of the rows. */
	isLoading?: boolean;
	/** A clear button on the trigger while there is a value. */
	isClearable?: boolean;
	/** Focus the search field once the sheet has settled. @default true */
	openOnFocus?: boolean;
	/** Offer the typed text as a value of its own when no option's label is exactly it. */
	allowCustomValue?: boolean;
	/** What the create row reads. @default (query) => `Use “${query}”` */
	createLabel?: (query: string) => string;
	/** What an empty list says, and what a screen reader hears. Replace the whole thing with `Combobox.Empty`. @default "No results" */
	emptyText?: string;
	/** The search field's placeholder; with the field label, its accessible name. @default "Search" */
	searchPlaceholder?: string;
	/** What a screen reader hears after a filter, past zero. @default (n) => "1 result" / `${n} results` */
	formatResultsCount?: (count: number) => string;
	/** Where the options open. Only `sheet` today. */
	presentation?: ComboboxPresentation;
	/** Forwarded to the sheet. Leave it off and the sheet opens at its cap and holds that height while you type. */
	snapPoints?: BottomSheetProps["snapPoints"];
	/** Bold what the query matched in each row. @default true */
	highlight?: boolean;
	/** Classes for the trigger. */
	className?: string;
	/** On the trigger; rows take `${testID}-option-${value}`, search `-search`, create `-create`, Done `-done`; the trigger's chevron `-chevron`, clear `-clear`, chips `-chip-${value}` and `-remove-${value}`. */
	testID?: string;
	/** `Combobox.Item`, `Combobox.Group`, and optionally `Combobox.Trigger` or `Combobox.Empty`. */
	children?: ReactNode;
};

export type ComboboxSingleProps = ComboboxBaseProps & {
	selectionMode?: "single";
	value?: string | null;
	defaultValue?: string | null;
	onValueChange?: (value: string | null) => void;
};

export type ComboboxMultipleProps = ComboboxBaseProps & {
	selectionMode: "multiple";
	value?: readonly string[];
	defaultValue?: readonly string[];
	onValueChange?: (value: string[]) => void;
	/** Once this many are chosen, the remaining rows are disabled. */
	maxSelected?: number;
	/** What a row disabled by `maxSelected` says when it has no description. @default "Limit reached" */
	limitReachedText?: string;
	/** How the chips are painted. @default "soft" */
	chipVariant?: ChipVariant;
	/** How many chips the trigger draws before folding the rest into `+N`. @default 3 */
	maxVisibleChips?: number;
	/** The footer button that closes the sheet. Multiple never closes on a pick. @default "Done" */
	doneText?: string;
};

export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps;

const NO_VALUES: readonly string[] = [];
const DEFAULT_FILTER: ComboboxFilter = { kind: "default" };
const IDLE: ComboboxPendingRemoveState = { kind: "idle" };
const CLEAR_HIT_SLOP = 8;

/**
 * Claims the JS responder for a touch inside the sheet.
 *
 * Every `Pressable` here is a Gesture Handler tap, which React Native's
 * responder system never sees. The list is `keyboardShouldPersistTaps="handled"`,
 * so it finds such a tap unclaimed, takes the responder itself and blurs the
 * search field on release — the keyboard drops under a clear press, a chip
 * removal, or a multiple-mode pick that should leave you typing. Claiming the
 * touch on a wrapping view is what tells the list it was handled.
 */
const claimTouch = (): boolean => true;

const defaultCreateLabel = (query: string): string => `Use “${query}”`;

function ComboboxRoot(props: ComboboxProps): ReactElement {
	const {
		options,
		inputValue,
		defaultInputValue = "",
		onInputValueChange,
		filter = DEFAULT_FILTER,
		placeholder,
		title,
		variant = "primary",
		size = "md",
		isInvalid,
		isDisabled,
		isReadOnly = false,
		isLoading = false,
		isClearable = false,
		openOnFocus = true,
		allowCustomValue = false,
		createLabel = defaultCreateLabel,
		emptyText = "No results",
		searchPlaceholder = "Search",
		formatResultsCount,
		snapPoints,
		highlight = true,
		className,
		testID,
		children,
	} = props;
	const mode = props.selectionMode ?? "single";
	const multiple = props.selectionMode === "multiple" ? props : null;

	const field = useFieldContext();
	const { height: windowHeight } = useWindowDimensions();
	const { top: topInset } = useSafeAreaInsets();
	const resolvedIsInvalid = isInvalid ?? field?.isInvalid ?? false;
	const resolvedIsDisabled = isDisabled ?? field?.isDisabled ?? false;

	// Rows come from data, never from live children — the same contract as
	// Select — so the filter can drop them and the list can recycle them.
	const entries = useMemo(
		() => normalizeComboboxOptions(options ?? collectComboboxOptions(children)),
		[options, children]
	);
	const customTrigger = findChildOfType(children, ComboboxTrigger);
	const customEmpty = findChildOfType(children, ComboboxEmpty);

	// Inside, a selection is always a list, as in Select.
	const controlled = useMemo(() => toSelectedValues(props.value), [props.value]);
	const [selected, setSelected] = useControllableState<readonly string[]>({
		defaultValue: toSelectedValues(props.defaultValue) ?? NO_VALUES,
		onChange: (next) => {
			if (props.selectionMode === "multiple") props.onValueChange?.([...next]);
			else props.onValueChange?.(next[0] ?? null);
		},
		value: controlled,
	});

	const [query, setQueryState] = useControllableState<string>({ defaultValue: defaultInputValue, value: inputValue });
	const setQuery = (next: string, reason: ComboboxInputChangeReason) => {
		setQueryState(next);
		onInputValueChange?.(next, reason);
	};
	const resetQuery = (reason: Exclude<ComboboxInputChangeReason, "type">) => {
		const change = resolveQueryReset(query, reason);
		if (change) setQuery(change.value, change.reason);
	};

	// A server-driven list changes under the selection, so each option is
	// remembered as it is picked: the trigger can still name it after the
	// results that held it are gone.
	const [remembered, setRemembered] = useState<ReadonlyMap<string, SelectOption>>(() => new Map());
	const remember = (option: SelectOption) => {
		setRemembered((previous) => new Map(previous).set(option.value, { label: option.label, value: option.value }));
	};

	const [isOpen, setOpen] = useState(false);
	const [pending, setPending] = useState<ComboboxPendingRemoveState>(IDLE);
	const inputRef = useRef<TextInputInstance | null>(null);
	const canOpen = !resolvedIsDisabled && !isReadOnly;

	const open = useCallback(() => {
		if (canOpen) setOpen(true);
	}, [canOpen]);

	// One path for every close — Done, a swipe, the overlay, the close button —
	// and each one empties the query, so the next open starts from the whole
	// list, and blurs the field, so the keyboard leaves with the sheet rather
	// than lingering over the screen after it.
	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (next) return;
		inputRef.current?.blur();
		setPending(IDLE);
		resetQuery("close");
	};
	const close = () => handleOpenChange(false);

	const sheetHeight = resolveComboboxSheetHeight({ topInset, windowHeight });
	const fixedSnapPoints = useMemo(() => [sheetHeight], [sheetHeight]);

	// The field is focused once the sheet has settled, never with it: a
	// keyboard rising while the sheet is still animating up fights it for the
	// same space.
	const handleIndexChange = (index: number) => {
		if (index >= 0 && openOnFocus) inputRef.current?.focus();
	};

	const maxSelected = multiple?.maxSelected;
	const toggleOptions: SelectToggleOptions =
		mode === "multiple" ? { max: maxSelected, mode: "multiple" } : { isClearable, mode: "single" };

	const byValue = useMemo(() => new Map(entries.map((entry) => [entry.option.value, entry.option])), [entries]);

	const selectedOptions = useMemo(
		() => resolveSelectedComboboxOptions({ allowCustomValue, entries, remembered, selected }),
		[allowCustomValue, entries, remembered, selected]
	);

	const commit = (value: string, option: SelectOption) => {
		const result = toggleSelection(selected, value, toggleOptions);
		if (result.change === "blocked" || result.change === "limit-reached") playHaptic("warning");
		if (result.change === "blocked") return;
		if (result.change !== "unchanged") setSelected(result.selected);
		if (result.change === "selected" || result.change === "limit-reached") remember(option);
		setPending(IDLE);
		resetQuery("select");
		if (mode === "single") {
			inputRef.current?.blur();
			setOpen(false);
		}
	};

	const toggle = (value: string) => {
		const option = byValue.get(value) ?? selectedOptions.find((item) => item.value === value);
		commit(value, option ?? { label: value, value });
	};

	const create = (text: string) => commit(text, { label: text, value: text });

	const remove = (value: string) => {
		setSelected(selected.filter((item) => item !== value));
		setPending(IDLE);
		playHaptic("light");
	};

	const clear = () => {
		setSelected(NO_VALUES);
		setPending(IDLE);
		resetQuery("clear");
	};

	// Offered to an enclosing `Field`, so tapping its label opens the sheet.
	const registerPress = field?.registerPress;
	useEffect(() => {
		if (!registerPress) return;
		registerPress(open);
		return () => registerPress(null);
	}, [open, registerPress]);

	const filtered = useMemo(() => filterItems(entries, query, filter), [entries, query, filter]);
	const createQuery = shouldOfferCreate({ allowCustomValue, entries, query, selected }) ? query.trim() : null;
	const rows = useMemo(() => buildComboboxRows(filtered, createQuery), [filtered, createQuery]);
	const announcement = resolveResultsAnnouncement({
		count: filtered.length,
		emptyText,
		format: formatResultsCount,
		query,
	});

	// Android reads the live region below as it changes; iOS has no live
	// regions, so the count is posted to VoiceOver directly.
	useEffect(() => {
		if (isOpen && announcement && Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(announcement);
	}, [announcement, isOpen]);

	const sheetTitle = title ?? field?.label ?? undefined;
	const chipVariant = multiple?.chipVariant ?? "soft";
	const limitReachedText = multiple?.limitReachedText ?? "Limit reached";

	const context: ComboboxContextValue = {
		accessibilityLabel: field?.label ?? title,
		chipVariant,
		clear,
		close,
		inputValue: query,
		isClearable,
		isDisabled: resolvedIsDisabled,
		isInvalid: resolvedIsInvalid,
		isLoading,
		isOpen,
		isReadOnly,
		maxVisibleChips: multiple?.maxVisibleChips,
		open,
		placeholder,
		remove,
		selectedOptions,
		selectedValues: selected,
		selectionMode: mode,
		size,
		testID,
		toggle,
		triggerText: resolveComboboxTriggerText({ mode, selected: selectedOptions }),
		variant,
	};

	const select = selectVariants({ size, variant });
	const slots = comboboxVariants({ size, variant });

	const handleChangeText = (text: string) => {
		if (pending.kind === "pending") setPending(IDLE);
		setQuery(text, "type");
	};

	// Backspace on an empty query marks the last chip, and a second one removes
	// it — see `resolvePendingRemove`. Any other key clears the mark.
	const handleKeyPress = ({ nativeEvent }: TextInputKeyPressEvent) => {
		if (mode !== "multiple") return;
		if (nativeEvent.key !== "Backspace") {
			if (pending.kind === "pending") setPending(IDLE);
			return;
		}
		const result = resolvePendingRemove(pending, {
			chipCount: selectedOptions.length,
			query,
			type: "backspace",
		});
		setPending(result.state);
		const target = result.removeIndex === null ? undefined : selectedOptions[result.removeIndex];
		if (target) remove(target.value);
	};

	const renderRowContent = (item: ComboboxListRow): ReactElement => {
		if (item.kind === "heading") {
			return (
				<Text.Overline accessibilityRole="header" className={select.groupHeading()} color="muted">
					{item.label}
				</Text.Overline>
			);
		}
		if (item.kind === "create") {
			return (
				<ComboboxCreateRow
					isDisabled={maxSelected !== undefined && selected.length >= maxSelected}
					label={createLabel(item.query)}
					onPress={create}
					query={item.query}
					size={size}
					testID={testID ? `${testID}-create` : undefined}
				/>
			);
		}
		const isSelected = selected.includes(item.option.value);
		const state = resolveSelectRowState({
			isSelected,
			maxSelected,
			option: item.option,
			selectedCount: selected.length,
		});
		const isLimited = state.isDisabled && state.reason === "limit" && !item.option.description;

		return (
			<SelectOptionRow
				description={isLimited ? limitReachedText : undefined}
				highlight={highlight ? getHighlightRanges(item.option.label, query) : undefined}
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

	// Multiple mode stays open for the next pick, so its rows keep the keyboard
	// up; a single pick closes the sheet and lets it go.
	const renderRow = ({ item }: { item: ComboboxListRow }): ReactElement =>
		mode === "multiple" ? (
			<View onStartShouldSetResponder={claimTouch}>{renderRowContent(item)}</View>
		) : (
			renderRowContent(item)
		);

	const searchSuffix = isLoading ? (
		<Spinner color="muted-foreground" size={size} />
	) : query !== "" ? (
		<View onStartShouldSetResponder={claimTouch}>
			<Pressable
				accessibilityLabel="Clear search"
				accessibilityRole="button"
				className={slots.clear()}
				feedback="fade"
				hitSlop={CLEAR_HIT_SLOP}
				onPress={() => resetQuery("clear")}
				testID={testID ? `${testID}-search-clear` : undefined}
			>
				<Icon color="muted-foreground" icon={IconCrossSmall} size={size} />
			</Pressable>
		</View>
	) : null;

	const searchLabel = field?.label ? `${field.label}, ${searchPlaceholder}` : searchPlaceholder;

	// The title, chips and search field ride at the head of the list, so they
	// scroll with it.
	const header = (
		<View className={slots.header()}>
			<BottomSheet.Close />
			{sheetTitle ? <BottomSheet.Title>{sheetTitle}</BottomSheet.Title> : null}
			{multiple && selectedOptions.length > 0 ? (
				<View onStartShouldSetResponder={claimTouch}>
					<ComboboxChipRow
						chipVariant={chipVariant}
						onRemove={remove}
						options={selectedOptions}
						pendingIndex={pending.kind === "pending" ? pending.index : null}
						size={size}
						testID={testID ? `${testID}-sheet` : undefined}
					/>
				</View>
			) : null}
			<Input.Group size={size}>
				<Input.Group.Prefix>
					<Icon icon={IconMagnifyingGlass} />
				</Input.Group.Prefix>
				<BottomSheet.TextInput
					accessibilityLabel={searchLabel}
					autoCapitalize="none"
					autoCorrect={false}
					onBlur={() => setPending(IDLE)}
					onChangeText={handleChangeText}
					onKeyPress={handleKeyPress}
					placeholder={searchPlaceholder}
					ref={inputRef}
					returnKeyType="search"
					testID={testID ? `${testID}-search` : undefined}
					value={query}
				/>
				{searchSuffix ? <Input.Group.Suffix>{searchSuffix}</Input.Group.Suffix> : null}
			</Input.Group>
			{announcement && rows.length > 0 ? (
				<Text accessibilityLiveRegion="polite" className={slots.results()}>
					{announcement}
				</Text>
			) : null}
		</View>
	);

	const empty = customEmpty ?? (
		<View className={slots.empty()}>
			{isLoading ? (
				<Spinner color="muted-foreground" />
			) : (
				<Text accessibilityLiveRegion="polite" color="muted">
					{emptyText}
				</Text>
			)}
		</View>
	);

	return (
		<ComboboxProvider value={context}>
			{customTrigger ?? <ComboboxTrigger className={className} />}
			<BottomSheet
				dynamicSizing={false}
				enableBlurKeyboardOnGesture={false}
				isOpen={isOpen}
				keyboardLiftLimit="highestSnapPoint"
				onIndexChange={handleIndexChange}
				onOpenChange={handleOpenChange}
				snapPoints={snapPoints ?? fixedSnapPoints}
			>
				<BottomSheet.Portal>
					<BottomSheet.Overlay />
					<BottomSheet.Container>
						<BottomSheet.FlatList
							contentContainerClassName={slots.sheetBody()}
							data={rows}
							extraData={selected}
							keyboardDismissMode="none"
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
		</ComboboxProvider>
	);
}

/**
 * A text field that filters a long or remote list as you type, then commits a
 * choice — from a bottom sheet.
 *
 * Where `Select` picks from a short, known set, `Combobox` finds in a long one:
 * the sheet opens with a search field focused, the rows filter as you type
 * (accent- and case-insensitive on the label and `keywords`, a predicate of
 * your own, or not at all for a server that does the matching) and the
 * matched run of each label is bold.
 *
 * Single selection by default — a pick closes the sheet. `selectionMode="multiple"`
 * keeps it open, shows the selection as removable chips on the trigger and above
 * the search field, and closes from a Done footer; Backspace in an empty search
 * field marks the last chip, and a second one removes it. `allowCustomValue`
 * offers the typed text as a value of its own.
 *
 * The query is yours to control with `inputValue` and `onInputValueChange`,
 * separately from the value. Inside a `Field` the combobox takes its invalid
 * and disabled state, reads its label as its accessible name and sheet title,
 * and opens when the label is tapped.
 *
 * The sheet engine is an optional peer: an app using `Combobox` installs
 * `@delacour/react-native-bottom-sheet` and mounts `BottomSheetProvider` once.
 *
 * @example
 * <Field>
 *   <Field.Label>Assignee</Field.Label>
 *   <Combobox
 *     filter={{ kind: "none" }}
 *     inputValue={query}
 *     isClearable
 *     isLoading={isFetching}
 *     onInputValueChange={setQuery}
 *     onValueChange={setAssignee}
 *     options={people}
 *     value={assignee}
 *   />
 * </Field>
 *
 * @example
 * <Combobox allowCustomValue onValueChange={setTags} options={tags} selectionMode="multiple" value={selected} />
 */
export const Combobox = Object.assign(ComboboxRoot, {
	/** One option, declared as a child. Renders nothing; the root reads its props. */
	Item: ComboboxItem,
	/** A titled run of `Combobox.Item`s. A query that empties it hides its heading. */
	Group: ComboboxGroup,
	/** The control that opens the sheet. Compose it only to replace the default one. */
	Trigger: ComboboxTrigger,
	/** What the sheet shows when no row is left. Replaces `emptyText`. */
	Empty: ComboboxEmpty,
	displayName: "DelacourUI.Combobox",
});
