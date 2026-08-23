import type { ReactElement } from "react";
import { Text } from "../text";
import { useFieldContext } from "./field.context";
import type { FieldTextProps } from "./field.types";
import { fieldVariants, resolveFieldTextColor } from "./field.variants";

/**
 * The name of the control this field holds.
 *
 * Renders `Text.Label` and passes it a colour, never a size or a weight — the
 * type scale belongs to the preset, and restating it here would be a second
 * definition of `Text.Label` that could drift from it. It turns danger with the
 * control when the field is invalid, so the pair reads as one state.
 *
 * There is no `htmlFor`. React Native has no `<label>` element and no
 * label-for-control association, which is also why there is no `Field.Title`:
 * on the web that part exists only because a `<div>` is not a `<label>`, and
 * here both would be the same `Text`.
 */
export function FieldLabel({ className, color, ...props }: FieldTextProps): ReactElement {
	const field = useFieldContext();
	const isInvalid = field?.isInvalid ?? false;
	const isDisabled = field?.isDisabled ?? false;

	return (
		<Text.Label
			className={fieldVariants({ isDisabled, isInvalid }).label({ className })}
			color={color ?? resolveFieldTextColor("label", isInvalid)}
			{...props}
		/>
	);
}
