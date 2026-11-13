import { type ReactElement, useCallback } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { useFieldControlAccessibility } from "../field/field-control";
import { resolvePlaceholderAccentClass, resolveSelectionAccentClass } from "../input/input.variants";
import { useFeedbackPart } from "./feedback.context";
import { feedbackVariants, resolveFeedbackFieldHeightStyle } from "./feedback.variants";

export type FeedbackFieldProps = Omit<TextInputProps, "value" | "onChangeText" | "multiline"> & {
	className?: string;
	/** Rows before it grows. Default 6. */
	minRows?: number;
	/** Rows it grows to before it scrolls. Default 12. */
	maxRows?: number;
	/** Read-only — while sending, say. A send in flight makes it read-only on its own. */
	isDisabled?: boolean;
	/** Overrides the enclosing `Field`'s invalid state. */
	isInvalid?: boolean;
	/** Overrides the enclosing `Field`'s required state. */
	isRequired?: boolean;
};

/**
 * Where the message is written: a bare multiline `TextInput` with no box of
 * its own, because the well around it is the box.
 *
 * The draft is the root's — `value` and `onChangeText` are withheld — so it
 * survives the dialog closing and reopening, and `useFeedback().clear()` is
 * the one way to empty it. It is floored at `minRows` and grows to `maxRows`
 * before it scrolls (`resolveFeedbackFieldHeightStyle`), as a style, since a
 * runtime number cannot be a Tailwind class.
 *
 * While a promise from `Feedback.Submit` is in flight it is read-only, so what
 * is being sent is what stays on screen. Inside a `Field` it takes the field's
 * label as its name and speaks the field's required state, error and
 * description; otherwise its label defaults to the title's text when the title
 * is a plain string, then to the placeholder.
 *
 * Placeholder, caret and selection take `Input`'s `accent-*` defaults.
 *
 * @example
 * <Feedback.Field placeholder="Tell us what got in your way" />
 */
export function FeedbackField({
	className,
	minRows,
	maxRows,
	isDisabled = false,
	isInvalid,
	isRequired,
	accessibilityHint,
	accessibilityLabel,
	editable,
	placeholder,
	style,
	...props
}: FeedbackFieldProps): ReactElement {
	const { value, setValue, isSending, titleText } = useFeedbackPart("Feedback.Field");
	const isReadOnly = isDisabled || isSending;
	const a11y = useFieldControlAccessibility({
		accessibilityHint,
		accessibilityLabel,
		fallbackLabel: titleText ?? placeholder,
		isInvalid,
		isRequired,
	});
	const selectionAccent = resolveSelectionAccentClass({});

	const handleChangeText = useCallback((text: string) => setValue(text), [setValue]);

	return (
		<TextInput
			accessibilityHint={a11y.accessibilityHint}
			accessibilityLabel={a11y.accessibilityLabel}
			accessibilityLabelledBy={a11y.accessibilityLabelledBy}
			accessibilityState={{ disabled: isReadOnly }}
			className={feedbackVariants().field({ className })}
			cursorColorClassName={selectionAccent}
			placeholderTextColorClassName={resolvePlaceholderAccentClass()}
			selectionColorClassName={selectionAccent}
			style={[resolveFeedbackFieldHeightStyle({ maxRows, minRows }), style]}
			textAlignVertical="top"
			{...props}
			editable={isReadOnly ? false : editable}
			multiline
			onChangeText={handleChangeText}
			placeholder={placeholder}
			value={value}
		/>
	);
}
FeedbackField.displayName = "DelacourUI.Feedback.Field";
