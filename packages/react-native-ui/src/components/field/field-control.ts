import { useEffect } from "react";
import { Platform } from "react-native";
import { useFieldContext } from "./field.context";
import {
	type FieldAccessibilityLabels,
	type FieldControlAccessibility,
	resolveFieldControlAccessibility,
} from "./field.variants";

export type UseFieldControlAccessibilityOptions = {
	/** The caller's own `accessibilityLabel`. Used verbatim when set. */
	accessibilityLabel?: string;
	/** The caller's own `accessibilityHint`. Kept, after the field's error and description. */
	accessibilityHint?: string;
	/** The control's own name, which beats the field's label — a `Checkbox`'s inline text. */
	defaultLabel?: string;
	/** The name when neither the control nor the field has one — `TimePicker`'s "Time". */
	fallbackLabel?: string;
	/** The control's own `isInvalid`, which beats the field's. */
	isInvalid?: boolean;
	/** The control's own `isRequired`, which beats the field's. */
	isRequired?: boolean;
	/** The spoken words, for localisation. */
	labels?: FieldAccessibilityLabels;
};

/**
 * Everything a form control needs from the `Field` around it, for a screen reader.
 *
 * Reads the field's context, resolves the name, hint and validity through
 * {@link resolveFieldControlAccessibility}, and — when the control takes the
 * field's label as its name — claims the label, so `Field.Label` steps out of
 * the accessibility tree rather than being read twice. Outside a `Field` it
 * returns the caller's own props unchanged.
 *
 * Spread `accessibilityLabel`, `accessibilityHint` and `accessibilityLabelledBy`
 * onto the element a screen reader focuses, and render with the returned
 * `isInvalid`.
 *
 * Lives in its own module, so a control imports this and the context without
 * importing `../field` and closing a cycle. See AGENTS.md rule 3.
 */
export function useFieldControlAccessibility(
	options: UseFieldControlAccessibilityOptions = {}
): FieldControlAccessibility {
	const field = useFieldContext();
	const claimLabel = field?.claimLabel;
	const takesFieldLabel = options.accessibilityLabel === undefined && options.defaultLabel === undefined;

	useEffect(() => {
		if (!claimLabel || !takesFieldLabel) return;
		return claimLabel();
	}, [claimLabel, takesFieldLabel]);

	return resolveFieldControlAccessibility({ ...options, field, platform: Platform.OS });
}
