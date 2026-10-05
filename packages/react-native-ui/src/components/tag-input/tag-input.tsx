import {
	type ReactElement,
	type ReactNode,
	type Ref,
	type RefObject,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import {
	AccessibilityInfo,
	type NativeSyntheticEvent,
	TextInput,
	type TextInputKeyPressEventData,
	type TextInputProps,
	View,
} from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import type { ChipVariant } from "../chip/chip.variants";
import { useFieldContext } from "../field/field.context";
import type { InputProps } from "../input";
import {
	type InputSize,
	type InputVariant,
	resolvePlaceholderAccentClass,
	resolveSelectionAccentClass,
} from "../input/input.variants";
import { Pressable, playHaptic } from "../pressable";
import { type TagInputContextValue, TagInputProvider } from "./tag-input.context";
import {
	commitDraft,
	ingestText,
	resolveAddAnnouncement,
	resolveBackspace,
	resolveBlur,
	resolveRejectAnnouncement,
	resolveRemoveAnnouncement,
	resolveSubmit,
	resolveTagInputState,
	resolveTagsAccessibilityLabel,
	shouldFireRejectHaptic,
	type TagInputCommitOptions,
	type TagInputCommitResult,
} from "./tag-input.logic";
import type {
	TagInputBlurBehavior,
	TagInputHandle,
	TagInputRejection,
	TagInputRejectReason,
	TagInputTagState,
} from "./tag-input.types";
import { resolveTagInputBoxClass, resolveTagInputFieldClass, tagInputVariants } from "./tag-input.variants";
import { TagInputChip } from "./tag-input-chip";
import { TagInputSuffix } from "./tag-input-suffix";

type InputFocusEvent = Parameters<NonNullable<TextInputProps["onFocus"]>>[0];
type InputBlurEvent = Parameters<NonNullable<TextInputProps["onBlur"]>>[0];

const DEFAULT_DELIMITERS: readonly string[] = [","];

function defaultRemoveAccessibilityLabel(tag: string): string {
	return `Remove ${tag}`;
}

function defaultAnnounce(message: string): void {
	AccessibilityInfo.announceForAccessibility(message);
}

/**
 * A stable key per tag: the text plus which occurrence of it this is, so a
 * removal leaves every other chip's identity alone and the layout transition
 * moves them rather than re-mounting them. Duplicates only exist with
 * `allowDuplicates`, and the occurrence count keeps those apart.
 */
function tagKeys(tags: readonly string[]): string[] {
	const seen = new Map<string, number>();
	return tags.map((tag) => {
		const occurrence = seen.get(tag) ?? 0;
		seen.set(tag, occurrence + 1);
		return `${tag}\u0000${occurrence}`;
	});
}

/**
 * The haptics, announcements and `onReject` calls one commit produces, run
 * after its tags have been set — so a caller's `onReject` reading the list back
 * sees the one the accepted pieces landed in.
 *
 * One haptic per commit whatever its size, and the warning is throttled — a
 * paste refused ten times buzzes once. An `empty` `add()` is reported and
 * announced but does not buzz: nothing is wrong with the list, only nothing
 * was typed.
 */
function reportCommit(
	result: TagInputCommitResult,
	{
		speak,
		onReject,
		rejectMessages,
		lastRejectHapticAt,
	}: {
		speak: (message: string) => void;
		onReject: ((rejection: TagInputRejection) => void) | undefined;
		rejectMessages: Partial<Record<TagInputRejectReason, string>> | undefined;
		lastRejectHapticAt: RefObject<number | null>;
	}
): void {
	if (result.accepted.length > 0) {
		playHaptic("selection");
		speak(result.accepted.map(resolveAddAnnouncement).join(", "));
	}
	for (const rejection of result.rejected) onReject?.(rejection);
	const first = result.rejected[0];
	if (!first) return;
	speak(resolveRejectAnnouncement(first.reason, rejectMessages));
	if (first.reason === "empty") return;
	const now = Date.now();
	if (shouldFireRejectHaptic(lastRejectHapticAt.current, now)) {
		lastRejectHapticAt.current = now;
		playHaptic("warning");
	}
}

export type TagInputProps = Omit<
	InputProps,
	| "value"
	| "defaultValue"
	| "onChangeText"
	| "onChange"
	| "variant"
	| "size"
	| "multiline"
	| "ref"
	| "onSubmitEditing"
	| "isInvalid"
	| "isDisabled"
	| "placeholder"
	| "className"
	| "testID"
	| "children"
> & {
	/** Controlled tags. */
	value?: readonly string[];
	/** Starting tags while uncontrolled. */
	defaultValue?: readonly string[];
	onValueChange?: (tags: string[]) => void;
	/** Controlled draft — the text still being typed. */
	inputValue?: string;
	defaultInputValue?: string;
	onInputValueChange?: (text: string) => void;
	/** Single characters that commit the text before them. Default `[","]`. Return always commits. */
	delimiters?: readonly string[];
	/** The most tags the list holds. Further tags are refused with `max`, unless `allowOverflow`. */
	max?: number;
	/** Accept tags past `max`, and mark the field invalid while it is over. Default `false`. */
	allowOverflow?: boolean;
	/** Accept a tag already in the list. Default `false`. */
	allowDuplicates?: boolean;
	/** Tell `Design` and `design` apart when checking for a duplicate. Default `false`. */
	caseSensitiveDuplicates?: boolean;
	/** Return `false` to refuse a tag as `invalid`. Sees the trimmed, transformed tag. */
	validate?: (tag: string, current: readonly string[]) => boolean;
	/** Called once per refused tag, with the reason. */
	onReject?: (rejection: TagInputRejection) => void;
	/** Applied to every tag after trimming — lowercase it, strip a `#`. */
	transform?: (raw: string) => string;
	/** What leaving the field does with the text in it. Default `add`. */
	blurBehavior?: TagInputBlurBehavior;
	/** Show a clear-all control at the end of the box while there is something to clear. */
	isClearable?: boolean;
	/** Show a tag count at the end of the box — `3/10` with a `max`. */
	showCount?: boolean;
	variant?: InputVariant;
	size?: InputSize;
	/** How a resting tag is painted. Default `soft`. */
	chipVariant?: ChipVariant;
	/** Inherited from an enclosing `Field` when unset. Overflowing `max` also makes the field invalid. */
	isInvalid?: boolean;
	/** Inherited from an enclosing `Field` when unset. */
	isDisabled?: boolean;
	/** Shows the tags with no field and no remove controls. */
	isReadOnly?: boolean;
	/** Shown only while there are no tags. */
	placeholder?: string;
	/** Name of one tag's remove control. Default `Remove ${tag}`. */
	removeAccessibilityLabel?: (tag: string) => string;
	/** Name of the clear-all control. Default `Clear all`. */
	clearAccessibilityLabel?: string;
	/** What a screen reader hears when a tag is refused, per reason. */
	rejectMessages?: Partial<Record<TagInputRejectReason, string>>;
	/**
	 * Speaks add, remove and reject messages. Default
	 * `AccessibilityInfo.announceForAccessibility`; `false` turns them off.
	 */
	announce?: ((message: string) => void) | false;
	/** Draws one tag in place of the default chip. */
	renderTag?: (tag: string, state: TagInputTagState) => ReactNode;
	/** Styles the box. */
	className?: string;
	/**
	 * Names the box. The parts derive theirs: `${testID}-input`,
	 * `${testID}-tag-${index}`, `${testID}-tag-${index}-remove`, `${testID}-clear`, `${testID}-count`.
	 */
	testID?: string;
	ref?: Ref<TagInputHandle>;
};

function TagInputRoot({
	value,
	defaultValue,
	onValueChange,
	inputValue,
	defaultInputValue,
	onInputValueChange,
	delimiters = DEFAULT_DELIMITERS,
	max,
	allowOverflow = false,
	allowDuplicates = false,
	caseSensitiveDuplicates = false,
	validate,
	onReject,
	transform,
	blurBehavior = "add",
	isClearable = false,
	showCount = false,
	variant = "primary",
	size = "md",
	chipVariant = "soft",
	isInvalid,
	isDisabled,
	isReadOnly = false,
	placeholder,
	removeAccessibilityLabel = defaultRemoveAccessibilityLabel,
	clearAccessibilityLabel = "Clear all",
	rejectMessages,
	announce = defaultAnnounce,
	renderTag,
	className,
	testID,
	ref,
	placeholderColorClassName,
	selectionColorClassName,
	accessibilityLabel,
	editable,
	onFocus,
	onBlur,
	onKeyPress,
	...props
}: TagInputProps): ReactElement {
	const field = useFieldContext();
	const fieldRef = useRef<TextInput | null>(null);
	const lastRejectHapticAt = useRef<number | null>(null);

	const [tags, setTags] = useControllableState<readonly string[]>({
		defaultValue: defaultValue ?? [],
		onChange: onValueChange ? (next) => onValueChange([...next]) : undefined,
		value,
	});
	const [draft, setDraft] = useControllableState({
		defaultValue: defaultInputValue ?? "",
		onChange: onInputValueChange,
		value: inputValue,
	});
	const [isFocused, setFocused] = useState(false);
	const [isArmed, setArmed] = useState(false);

	const {
		isDisabled: resolvedIsDisabled,
		isInvalid: resolvedIsInvalid,
		isOverflowing,
		isHidden,
		pendingRemoveIndex,
	} = resolveTagInputState({
		allowOverflow,
		count: tags.length,
		field,
		isArmed,
		isDisabled,
		isInvalid,
		isReadOnly,
		max,
	});

	const options: TagInputCommitOptions = {
		allowDuplicates,
		allowOverflow,
		caseSensitiveDuplicates,
		delimiters,
		max,
		transform,
		validate,
	};

	const speak = (message: string) => {
		if (announce) announce(message);
	};

	const applyTags = (result: TagInputCommitResult) => {
		if (result.accepted.length > 0) setTags(result.tags);
		reportCommit(result, { lastRejectHapticAt, onReject, rejectMessages, speak });
	};

	// The draft is written before the commit is reported, so a caller's
	// `onReject` is the last thing it hears — a hint it sets there is not wiped
	// by its own `onInputValueChange` reacting to the refused piece going back.
	const apply = (result: TagInputCommitResult) => {
		setArmed(false);
		if (result.draft !== draft) setDraft(result.draft);
		applyTags(result);
	};

	const remove = (index: number) => {
		if (resolvedIsDisabled || isReadOnly) return;
		const tag = tags[index];
		if (tag === undefined) return;
		setArmed(false);
		setTags(tags.filter((_, i) => i !== index));
		playHaptic("light");
		speak(resolveRemoveAnnouncement(tag));
	};

	const clear = () => {
		setArmed(false);
		if (tags.length > 0) setTags([]);
		if (draft.length > 0) setDraft("");
	};

	const add = (raw: string): TagInputRejectReason | null => {
		const result = commitDraft(raw, tags, options);
		setArmed(false);
		applyTags(result);
		return result.rejected[0]?.reason ?? null;
	};

	const focusField = useCallback(() => fieldRef.current?.focus(), []);

	useImperativeHandle(ref, () => ({
		add,
		blur: () => fieldRef.current?.blur(),
		clear,
		focus: focusField,
	}));

	// Offered to an enclosing `Field`, so tapping its label focuses the field.
	const registerPress = field?.registerPress;
	useEffect(() => {
		if (!registerPress) return;
		registerPress(focusField);
		return () => registerPress(null);
	}, [registerPress, focusField]);

	const handleChangeText = (text: string) => {
		setArmed(false);
		apply(ingestText(text, tags, options));
	};

	const handleSubmitEditing = () => {
		if (resolveSubmit(draft) === "blur") fieldRef.current?.blur();
		else apply(commitDraft(draft, tags, options));
	};

	// Backspace only reaches `onKeyPress` reliably while the field is empty —
	// the one case this needs. Any other key disarms, as does a text change.
	const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
		if (event.nativeEvent.key === "Backspace") {
			const action = resolveBackspace({ draft, isArmed, tagCount: tags.length });
			if (action.type === "arm") {
				setArmed(true);
				playHaptic("light");
			} else if (action.type === "remove") {
				remove(action.index);
			}
		} else if (isArmed) {
			setArmed(false);
		}
		onKeyPress?.(event);
	};

	const handleFocus = (event: InputFocusEvent) => {
		setFocused(true);
		onFocus?.(event);
	};

	const handleBlur = (event: InputBlurEvent) => {
		setFocused(false);
		setArmed(false);
		const action = resolveBlur(blurBehavior, draft);
		if (action === "commit") apply(commitDraft(draft, tags, options));
		else if (action === "clear") setDraft("");
		onBlur?.(event);
	};

	// Not memoised: `add`, `remove` and `clear` close over this render's tags,
	// so the value is new whenever they are. React Compiler memoises the rest.
	const context: TagInputContextValue = {
		add,
		chipVariant,
		clear,
		draft,
		isDisabled: resolvedIsDisabled,
		isFocused,
		isInvalid: resolvedIsInvalid,
		isOverflowing,
		isReadOnly,
		max,
		pendingRemoveIndex,
		remove,
		removeAccessibilityLabel,
		size,
		tags,
		testID,
		variant,
	};

	const selectionAccent = resolveSelectionAccentClass({
		className: selectionColorClassName,
		isInvalid: resolvedIsInvalid,
	});
	const keys = tagKeys(tags);

	// The box is a `Pressable` with no feedback, as `Input.Group` is: the field
	// only covers part of it, and a tap on the gutter or between chips has to
	// focus the field rather than land on nothing. A chip's remove control is a
	// detector of its own and keeps its press.
	return (
		<TagInputProvider value={context}>
			<Pressable
				accessible={false}
				className={resolveTagInputBoxClass({
					className,
					isDisabled: resolvedIsDisabled,
					isFocused,
					isInvalid: resolvedIsInvalid,
					size,
					variant,
				})}
				disabled={resolvedIsDisabled || isReadOnly || isHidden}
				feedback="none"
				onPress={focusField}
				testID={testID}
			>
				<View className={tagInputVariants({ size }).tags()}>
					{tags.map((tag, index) => (
						<TagInputChip index={index} key={keys[index]} renderTag={renderTag} tag={tag} />
					))}
					{isHidden ? null : (
						<TextInput
							accessibilityLabel={accessibilityLabel ?? field?.label ?? undefined}
							accessibilityValue={{ text: resolveTagsAccessibilityLabel(tags.length) }}
							autoCapitalize="none"
							autoCorrect={false}
							className={resolveTagInputFieldClass({ size })}
							cursorColorClassName={selectionAccent}
							placeholder={tags.length === 0 ? placeholder : undefined}
							placeholderTextColorClassName={resolvePlaceholderAccentClass(placeholderColorClassName)}
							returnKeyType="done"
							selectionColorClassName={selectionAccent}
							submitBehavior="submit"
							testID={testID ? `${testID}-input` : undefined}
							{...props}
							editable={resolvedIsDisabled ? false : editable}
							onBlur={handleBlur}
							onChangeText={handleChangeText}
							onFocus={handleFocus}
							onKeyPress={handleKeyPress}
							onSubmitEditing={handleSubmitEditing}
							ref={fieldRef}
							value={draft}
						/>
					)}
				</View>
				<TagInputSuffix
					clearAccessibilityLabel={clearAccessibilityLabel}
					isClearable={isClearable}
					showCount={showCount}
				/>
			</Pressable>
		</TagInputProvider>
	);
}

/**
 * Free-form entry of several values — recipients, labels, keywords — as chips
 * inside one field box.
 *
 * Type, then commit with Return or a delimiter (a comma by default); the text
 * becomes a removable chip and the keyboard stays up for the next. A paste
 * holding delimiters becomes several tags at once. Whitespace never commits,
 * and every tag is trimmed, then `transform`ed.
 *
 * A tag can be refused as a `duplicate` (case-insensitive by default), as
 * `invalid` by `validate`, or as over the `max`; each refusal reaches
 * `onReject` with its reason, a warning haptic and an announcement. An invalid
 * piece stays in the field so it can be corrected. `allowOverflow` accepts past
 * `max` and marks the field invalid instead.
 *
 * Backspace on an empty field arms the last tag — it turns destructive — and a
 * second Backspace removes it. Leaving the field commits what is left by
 * default; `blurBehavior` can clear or keep it instead.
 *
 * The box is `Input`'s, at its multiline floor, so it matches a field beside
 * it in every state. Inside a `Field` it takes the field's invalid and disabled
 * state and its label's name, and a tap on the label focuses it.
 *
 * Tags and draft are each controlled or uncontrolled.
 *
 * @example
 * <TagInput defaultValue={["design"]} placeholder="Add a label" />
 *
 * @example
 * <Field>
 *   <Field.Label>Recipients</Field.Label>
 *   <TagInput
 *     value={emails}
 *     onValueChange={setEmails}
 *     delimiters={[",", " ", ";"]}
 *     validate={isEmail}
 *     max={10}
 *     isClearable
 *     keyboardType="email-address"
 *   />
 * </Field>
 */
export const TagInput = Object.assign(TagInputRoot, {
	displayName: "DelacourUI.TagInput",
});
