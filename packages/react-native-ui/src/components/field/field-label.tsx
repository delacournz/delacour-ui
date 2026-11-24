import { type ReactElement, type ReactNode, useEffect } from "react";
import {
	LABEL_REQUIRED_MARK,
	LABEL_REQUIRED_MARK_COLOR,
	resolveLabelAccessibilityLabel,
} from "../label/label.variants";
import { Text } from "../text";
import { useFieldContext } from "./field.context";
import type { FieldTextProps } from "./field.types";
import { fieldVariants, resolveFieldLabelHidden, resolveFieldLabelText, resolveFieldTextColor } from "./field.variants";

/**
 * `Text`'s `children` may also be a Reanimated `SharedValue`. A label appends
 * its required mark to its children and reads them as text for the control
 * beside it, neither of which a shared value allows — the narrowing `Label` and
 * `Field.Error` make for the same reason.
 */
export type FieldLabelProps = Omit<FieldTextProps, "children"> & { children?: ReactNode };

/**
 * The name of the control this field holds.
 *
 * Renders `Text.Label` and passes it a colour, never a size or a weight — the
 * type scale belongs to the preset, and restating it here would be a second
 * definition of `Text.Label` that could drift from it. It turns destructive with the
 * control when the field is invalid, so the pair reads as one state. A required
 * field draws `Label`'s asterisk, glued to the last word by a no-break space.
 *
 * There is no `htmlFor`. React Native has no `<label>` element and no
 * label-for-control association, which is also why there is no `Field.Title`:
 * on the web that part exists only because a `<div>` is not a `<label>`, and
 * here both would be the same `Text`. **The association is made by hand
 * instead**: a string label hands its text to the field's context, and a control
 * inside reads it as its accessible name. `resolveFieldLabelText` decides what
 * qualifies. Once a control has claimed that name this label leaves the
 * accessibility tree, so a screen reader does not stop on "Email" twice. An
 * element label lends no text, so it stays readable, and renders the field's
 * `labelNativeID` for Android's `accessibilityLabelledBy` to point at.
 */
export function FieldLabel({ className, color, children, ...props }: FieldLabelProps): ReactElement {
	const field = useFieldContext();
	const isInvalid = field?.isInvalid ?? false;
	const isDisabled = field?.isDisabled ?? false;
	const isRequired = field?.isRequired ?? false;

	const registerLabel = field?.registerLabel;
	const labelText = resolveFieldLabelText(children);

	useEffect(() => {
		if (!registerLabel) return;
		registerLabel(labelText);
		return () => registerLabel(null);
	}, [labelText, registerLabel]);

	const isHidden = resolveFieldLabelHidden({ isClaimed: field?.isLabelClaimed ?? false, labelText });

	return (
		<Text.Label
			accessibilityElementsHidden={isHidden}
			accessibilityLabel={isRequired ? resolveLabelAccessibilityLabel({ children, isRequired }) : undefined}
			className={fieldVariants({ isDisabled, isInvalid }).label({ className })}
			color={color ?? resolveFieldTextColor("label", isInvalid)}
			importantForAccessibility={isHidden ? "no-hide-descendants" : "auto"}
			nativeID={field?.labelNativeID}
			{...props}
		>
			{children}
			{isRequired ? <Text color={LABEL_REQUIRED_MARK_COLOR}>{` ${LABEL_REQUIRED_MARK}`}</Text> : null}
		</Text.Label>
	);
}
FieldLabel.displayName = "DelacourUI.Field.Label";
