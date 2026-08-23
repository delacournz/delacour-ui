import { type ReactElement, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { type FieldContextValue, FieldProvider } from "./field.context";
import { type FieldOrientation, fieldVariants } from "./field.variants";
import { FieldContent } from "./field-content";
import { FieldDescription } from "./field-description";
import { FieldError } from "./field-error";
import { FieldGroup } from "./field-group";
import { FieldLabel } from "./field-label";
import { FieldLegend } from "./field-legend";
import { FieldSeparator } from "./field-separator";
import { FieldSet } from "./field-set";

export type FieldProps = ViewProps & {
	/** `vertical` stacks label over control; `horizontal` puts them side by side. */
	orientation?: FieldOrientation;
	/** Reports an invalid value. The label and the control inside both turn danger. */
	isInvalid?: boolean;
	/** The control inside is unavailable. Fades the label and disables the control. */
	isDisabled?: boolean;
	className?: string;
};

function FieldRoot({
	orientation = "vertical",
	isInvalid = false,
	isDisabled = false,
	className,
	...props
}: FieldProps): ReactElement {
	const context = useMemo<FieldContextValue>(
		() => ({ isDisabled, isInvalid, orientation }),
		[isDisabled, isInvalid, orientation]
	);

	return (
		<FieldProvider value={context}>
			<View
				accessibilityRole="none"
				className={fieldVariants({ isDisabled, isInvalid, orientation }).root({ className })}
				{...props}
			/>
		</FieldProvider>
	);
}

/**
 * One control, with its label, its description and its error.
 *
 * The layout every form in this library repeats, done once — and the one place a
 * field's state is written down. `<Field isInvalid>` turns the label danger
 * **and the control inside it too**, with nothing said at the control: `Input`
 * reads this field's context, and `Checkbox` and `Radio` will read the same one.
 *
 * That cascade is a React context rather than a class because it has to be.
 * Uniwind's data selectors match against the props of the component carrying the
 * class, so there is no parent-scoped `group-data-*` for a `Field` to style its
 * control with. See `field.context.tsx`.
 *
 * A control's own prop still wins, so one field inside an invalid group can opt
 * out with `<Input isInvalid={false} />`.
 *
 * The text parts render the `Text` presets and pass a colour, never a size —
 * `Field.Label` *is* `Text.Label`. There is no `Field.Title`: on the web it
 * exists because a `<div>` is not a `<label>`, and React Native has neither.
 *
 * @example
 * <Field>
 *   <Field.Label>Full name</Field.Label>
 *   <Input placeholder="Ada Lovelace" />
 *   <Field.Description>This appears on invoices.</Field.Description>
 * </Field>
 *
 * @example
 * <Field isInvalid={!isValid}>
 *   <Field.Label>Email</Field.Label>
 *   <Input inputMode="email" onChangeText={setEmail} value={email} />
 *   <Field.Error>{error}</Field.Error>
 * </Field>
 *
 * @example
 * <Field.Set>
 *   <Field.Legend>Profile</Field.Legend>
 *   <Field.Description>Shown on invoices and emails.</Field.Description>
 *   <Field.Group>
 *     <Field>
 *       <Field.Label>Username</Field.Label>
 *       <Input autoCapitalize="none" />
 *     </Field>
 *   </Field.Group>
 * </Field.Set>
 */
export const Field = Object.assign(FieldRoot, {
	/** A named section of a form — a legend, a description, and the fields under them. */
	Set: FieldSet,
	/** The title of a `Field.Set`. `variant="label"` for a nested one. */
	Legend: FieldLegend,
	/** A stack of fields, spaced so two never read as one. Inserts no dividers. */
	Group: FieldGroup,
	/** The control's name. Turns danger with the control when the field is invalid. */
	Label: FieldLabel,
	/** Supporting copy. Stays muted in every state, so an error is the line that changed. */
	Description: FieldDescription,
	/** What is wrong with the value. Renders nothing when it has no children. */
	Error: FieldError,
	/** A label and its description as one block, for a horizontal field. */
	Content: FieldContent,
	/** A rule between sections, optionally labelled between two rules. */
	Separator: FieldSeparator,
	displayName: "Field",
});
