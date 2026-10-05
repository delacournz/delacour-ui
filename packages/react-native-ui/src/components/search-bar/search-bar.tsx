import {
	type ReactElement,
	type ReactNode,
	type Ref,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { Keyboard, type TextInput, View } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { IconMagnifyingGlass } from "../../icons/central";
import { composeRefs } from "../../lib/compose-refs";
import { useFieldContext } from "../field/field.context";
import { Icon } from "../icon";
import { Input, type InputProps } from "../input";
import { Spinner } from "../spinner";
import { type SearchBarContextValue, SearchBarProvider } from "./search-bar.context";
import { createDebouncer } from "./search-bar.debounce";
import type { SearchBarHandle, SearchBarToken } from "./search-bar.types";
import {
	resolveSearchBarCancelVisibility,
	resolveSearchBarSuffix,
	resolveTokenBackspace,
	type SearchBarCancelMode,
	type SearchBarShape,
	type SearchBarSize,
	type SearchBarVariant,
	searchBarVariants,
} from "./search-bar.variants";
import { SearchBarCancel } from "./search-bar-cancel";
import { SearchBarCancelReveal } from "./search-bar-cancel-reveal";
import { SearchBarClear } from "./search-bar-clear";
import { SearchBarTokens } from "./search-bar-tokens";

/**
 * The events the field hands its callbacks, read off `InputProps` rather than
 * named outright so a React Native rename cannot leave them stale — the same
 * move `Input` makes.
 */
type SearchBarFocusEvent = Parameters<NonNullable<InputProps["onFocus"]>>[0];
type SearchBarBlurEvent = Parameters<NonNullable<InputProps["onBlur"]>>[0];
type SearchBarKeyPressEvent = Parameters<NonNullable<InputProps["onKeyPress"]>>[0];
type SearchBarSubmitEvent = Parameters<NonNullable<InputProps["onSubmitEditing"]>>[0];

export type SearchBarProps = Omit<
	InputProps,
	| "value"
	| "defaultValue"
	| "onChangeText"
	| "variant"
	| "size"
	| "multiline"
	| "ref"
	| "isDisabled"
	| "isInvalid"
	| "className"
	| "children"
> & {
	/** Controlled text. */
	value?: string;
	/** Starting text while uncontrolled. */
	defaultValue?: string;
	/** Every keystroke, and every clear or cancel that empties the field. */
	onValueChange?: (value: string) => void;
	/** Milliseconds `onDebouncedChange` waits after the last change. `0`, the default, reports every change at once. */
	debounce?: number;
	/**
	 * The text once it settles — `debounce` ms after the last change. Fires at
	 * once on the search key, and with `""` at once on clear or cancel. The
	 * place to run an expensive query.
	 */
	onDebouncedChange?: (value: string) => void;
	/** The keyboard's search key. Flushes a pending debounce first. */
	onSubmit?: (value: string) => void;
	/** The clear button was pressed. Focus and the keyboard stay. */
	onClear?: () => void;
	/** Cancel was pressed. The text is emptied and the keyboard dismissed. */
	onCancel?: () => void;
	/** The field gained or lost focus — swap a screen's content for results here. */
	onFocusChange?: (isFocused: boolean) => void;
	/** When the Cancel action is shown. Defaults to `focus`. */
	cancel?: SearchBarCancelMode;
	/** Cancel's text. Defaults to `Cancel`. */
	cancelLabel?: string;
	/** Visual variant of the box — `Input`'s. Defaults to `secondary`, the filled box. */
	variant?: SearchBarVariant;
	/** Size of the box — `Input`'s. */
	size?: SearchBarSize;
	/** The box's corner. `pill` (default) is a capsule; `rounded` keeps `Input`'s own corner. */
	shape?: SearchBarShape;
	/** A query is running: a spinner replaces the clear button, and the field reports busy. */
	isLoading?: boolean;
	/** Blocks editing, clearing and Cancel. Inherited from an enclosing `Field` when not given. */
	isDisabled?: boolean;
	/** Reports an invalid value. Inherited from an enclosing `Field` when not given. */
	isInvalid?: boolean;
	/** Active filters, drawn as chips inside the box ahead of the text. */
	tokens?: readonly SearchBarToken[];
	/** A token's remove control was pressed, or Backspace was pressed on an empty field. */
	onTokenRemove?: (token: SearchBarToken) => void;
	/** Defaults to `Search`. Also the field's accessible name when no `Field.Label` gives one. */
	placeholder?: string;
	/** Name a screen reader gives the clear button. Defaults to `Clear search`. */
	clearAccessibilityLabel?: string;
	/** Class for the row holding the field and Cancel. */
	className?: string;
	/** The `TextInput` itself — for a sheet's `useBottomSheetInput().ref`, or anything else that needs the node. */
	inputRef?: Ref<TextInput>;
	/** Replaces the default Cancel action — a `SearchBar.Cancel` with props of its own. */
	children?: ReactNode;
	ref?: Ref<SearchBarHandle>;
};

function SearchBarRoot({
	value: valueProp,
	defaultValue,
	onValueChange,
	debounce = 0,
	onDebouncedChange,
	onSubmit,
	onClear,
	onCancel,
	onFocusChange,
	cancel: cancelMode = "focus",
	cancelLabel = "Cancel",
	variant = "secondary",
	size = "md",
	shape = "pill",
	isLoading = false,
	isDisabled: isDisabledProp,
	isInvalid,
	tokens,
	onTokenRemove,
	placeholder = "Search",
	clearAccessibilityLabel = "Clear search",
	className,
	inputRef,
	children,
	ref,
	testID,
	accessibilityLabel,
	accessibilityState,
	editable,
	readOnly,
	onFocus,
	onBlur,
	onKeyPress,
	onSubmitEditing,
	...props
}: SearchBarProps): ReactElement {
	const field = useFieldContext();
	const fieldRef = useRef<TextInput | null>(null);
	const [isFocused, setFocused] = useState(false);
	const [value, setValue] = useControllableState({
		defaultValue: defaultValue ?? "",
		onChange: onValueChange,
		value: valueProp,
	});

	// Deliberately not defaulted in the destructure: a default there would
	// swallow the `Field` before it was consulted. `Input.Group` runs the same
	// ladder for the box; the bar needs the answer itself to hide clear and Cancel.
	const isDisabled = isDisabledProp ?? field?.isDisabled ?? false;
	const isReadOnly = readOnly === true || editable === false;

	// The debouncer is a dispatcher, not a query, so it reads the latest
	// callback through a ref and keeps one identity per `debounce`. A fresh
	// debouncer per render would drop the pending timer on every keystroke.
	const onDebouncedChangeRef = useRef(onDebouncedChange);
	useEffect(() => {
		onDebouncedChangeRef.current = onDebouncedChange;
	});

	const debouncer = useMemo(
		() =>
			createDebouncer<string, ReturnType<typeof setTimeout>>({
				cancelSchedule: clearTimeout,
				delay: debounce,
				onFire: (next) => onDebouncedChangeRef.current?.(next),
				schedule: setTimeout,
			}),
		[debounce]
	);
	useEffect(() => () => debouncer.cancel(), [debouncer]);

	const handleChangeText = useCallback(
		(next: string) => {
			setValue(next);
			debouncer.push(next);
		},
		[debouncer, setValue]
	);

	// Clearing is the start of the next search, so focus — and with it the
	// keyboard — stays. Refocusing covers a bar inside a scroll view whose tap
	// handling would otherwise have taken it.
	const clear = useCallback(() => {
		setValue("");
		debouncer.fireNow("");
		onClear?.();
		fieldRef.current?.focus();
	}, [debouncer, onClear, setValue]);

	// Cancel ends the search: the text goes, the keyboard goes. An empty field
	// has nothing to report, so only a pending debounce is dropped.
	const cancel = useCallback(() => {
		if (value.length > 0) {
			setValue("");
			debouncer.fireNow("");
		} else {
			debouncer.cancel();
		}
		fieldRef.current?.blur();
		Keyboard.dismiss();
		onCancel?.();
	}, [debouncer, onCancel, setValue, value]);

	useImperativeHandle(
		ref,
		() => ({
			blur: () => fieldRef.current?.blur(),
			clear,
			focus: () => fieldRef.current?.focus(),
		}),
		[clear]
	);

	const handleFocus = useCallback(
		(event: SearchBarFocusEvent) => {
			setFocused(true);
			onFocusChange?.(true);
			onFocus?.(event);
		},
		[onFocus, onFocusChange]
	);

	const handleBlur = useCallback(
		(event: SearchBarBlurEvent) => {
			setFocused(false);
			onFocusChange?.(false);
			onBlur?.(event);
		},
		[onBlur, onFocusChange]
	);

	// iOS reports the key before the text changes, so `value` is still the text
	// the key was pressed on: Backspace on an empty field reaches the tokens.
	const handleKeyPress = useCallback(
		(event: SearchBarKeyPressEvent) => {
			if (event.nativeEvent.key === "Backspace" && onTokenRemove && !isDisabled) {
				const backspace = resolveTokenBackspace(value, tokens);
				if (backspace.kind === "remove") onTokenRemove(backspace.token);
			}
			onKeyPress?.(event);
		},
		[isDisabled, onKeyPress, onTokenRemove, tokens, value]
	);

	const handleSubmitEditing = useCallback(
		(event: SearchBarSubmitEvent) => {
			debouncer.flush();
			onSubmit?.(value);
			onSubmitEditing?.(event);
		},
		[debouncer, onSubmit, onSubmitEditing, value]
	);

	const composedRef = useMemo(() => composeRefs<TextInput | null>(fieldRef, inputRef), [inputRef]);

	const isCancelVisible = resolveSearchBarCancelVisibility(cancelMode, {
		hasValue: value.length > 0,
		isDisabled,
		isFocused,
	});
	const suffix = resolveSearchBarSuffix({ isDisabled, isLoading, isReadOnly, value });

	const context = useMemo<SearchBarContextValue>(
		() => ({
			cancel,
			cancelLabel,
			clear,
			clearAccessibilityLabel,
			isCancelVisible,
			isDisabled,
			isFocused,
			isLoading,
			size,
			testID,
			value,
		}),
		[
			cancel,
			cancelLabel,
			clear,
			clearAccessibilityLabel,
			isCancelVisible,
			isDisabled,
			isFocused,
			isLoading,
			size,
			testID,
			value,
		]
	);

	const slots = searchBarVariants({ shape });
	const hasCancel = cancelMode !== "never" || children !== undefined;

	// The box is `Input.Group`'s, unchanged but for the shape's corner: the
	// border, the fill, the focus ring and the height all come from `Input`.
	// The field's own defaults sit before the caller's props so any of them can
	// be overridden; the handlers sit after, and call the caller's in turn.
	return (
		<SearchBarProvider value={context}>
			<View className={slots.root({ className })}>
				<Input.Group
					className={slots.field()}
					isDisabled={isDisabled}
					isInvalid={isInvalid}
					size={size}
					variant={variant}
				>
					<Input.Group.Prefix>
						<Icon icon={IconMagnifyingGlass} />
					</Input.Group.Prefix>
					{tokens && tokens.length > 0 ? <SearchBarTokens onTokenRemove={onTokenRemove} tokens={tokens} /> : null}
					<Input
						accessibilityLabel={accessibilityLabel ?? field?.label ?? placeholder}
						accessibilityRole="search"
						accessibilityState={{ ...accessibilityState, busy: isLoading }}
						autoCapitalize="none"
						autoCorrect={false}
						clearButtonMode="never"
						enterKeyHint="search"
						inputMode="search"
						placeholder={placeholder}
						returnKeyType="search"
						testID={testID}
						{...props}
						editable={editable}
						onBlur={handleBlur}
						onChangeText={handleChangeText}
						onFocus={handleFocus}
						onKeyPress={handleKeyPress}
						onSubmitEditing={handleSubmitEditing}
						readOnly={readOnly}
						ref={composedRef}
						value={value}
					/>
					{suffix === "none" ? null : (
						<Input.Group.Suffix>{suffix === "spinner" ? <Spinner /> : <SearchBarClear />}</Input.Group.Suffix>
					)}
				</Input.Group>
				{hasCancel ? (
					<SearchBarCancelReveal isVisible={isCancelVisible} key={cancelLabel}>
						{children ?? <SearchBarCancel />}
					</SearchBarCancelReveal>
				) : null}
			</View>
		</SearchBarProvider>
	);
}

/**
 * The query field at the top of a list or screen.
 *
 * An `Input.Group` with a search glyph, a clear button, an optional Cancel
 * action and debounced change reporting — a thin, opinionated layer over the
 * field so every list in an app searches the same way. It is a field, not a
 * results surface: results are the caller's own list, and `onFocusChange` is
 * how a screen swaps its content for them.
 *
 * - **Clear** keeps focus and the keyboard, and reports `""` at once.
 * - **Cancel** — shown on focus by default — empties the text, blurs the
 *   field and dismisses the keyboard.
 * - **`debounce`** delays `onDebouncedChange` until typing pauses; the search
 *   key flushes it, and clear and Cancel report at once.
 * - **`isLoading`** swaps the clear button for a spinner.
 * - **`tokens`** draws active filters as chips inside the box; Backspace on an
 *   empty field removes the last.
 *
 * Joins an enclosing `Field`: its disabled and invalid states, and its label
 * as the field's accessible name.
 *
 * @example
 * const [query, setQuery] = useState("");
 * <SearchBar value={query} onValueChange={setQuery} />
 *
 * @example
 * <SearchBar debounce={300} onDebouncedChange={runSearch} isLoading={isSearching} />
 *
 * @example
 * <SearchBar cancel="always">
 *   <SearchBar.Cancel>Done</SearchBar.Cancel>
 * </SearchBar>
 */
export const SearchBar = Object.assign(SearchBarRoot, {
	/** The Cancel action. Pass one as a child to change its label or variant; the bar still decides when it shows. */
	Cancel: SearchBarCancel,
	displayName: "DelacourUI.SearchBar",
});
