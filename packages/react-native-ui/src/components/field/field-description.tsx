import { type ReactElement, useEffect } from "react";
import { labelText } from "../label/label.variants";
import { Text } from "../text";
import { useFieldContext } from "./field.context";
import type { FieldTextProps } from "./field.types";
import { fieldVariants, resolveFieldTextColor } from "./field.variants";

/**
 * Supporting copy for the control — what the value is for, or what shape it
 * takes.
 *
 * Stays on the muted token whether the field is valid or not, so an appearing
 * `Field.Error` is the one line that changed. It does not fade with a disabled
 * field either: the control already dims itself, and a dimmed explanation on top
 * of a dimmed control reads as two problems rather than one state.
 *
 * Plain text children are handed to the field, and the control inside reads
 * them as its accessibility hint.
 */
export function FieldDescription({ className, color, ...props }: FieldTextProps): ReactElement {
	const field = useFieldContext();
	const isInvalid = field?.isInvalid ?? false;
	const isDisabled = field?.isDisabled ?? false;

	// Lent to the control as its hint — React Native's stand-in for
	// `aria-describedby`. Only text qualifies.
	const registerDescription = field?.registerDescription;
	const descriptionText = labelText(props.children) ?? null;
	useEffect(() => {
		if (!registerDescription) return;
		registerDescription(descriptionText);
		return () => registerDescription(null);
	}, [descriptionText, registerDescription]);

	return (
		<Text.Caption
			className={fieldVariants({ isDisabled, isInvalid }).description({ className })}
			color={color ?? resolveFieldTextColor("description", isInvalid)}
			{...props}
		/>
	);
}
FieldDescription.displayName = "DelacourUI.Field.Description";
