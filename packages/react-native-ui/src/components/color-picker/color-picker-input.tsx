import { type ReactElement, useCallback, useEffect, useState } from "react";
import type { TextInputProps } from "react-native";
import { composeRefs } from "../../lib/compose-refs";
import { useFieldContext } from "../field/field.context";
import { Input, type InputProps } from "../input";
import { isSameColor, parseColor, preserveHue } from "./color-picker.color";
import { useColorPickerPart } from "./color-picker.context";
import { colorPickerVariants, resolveColorPickerLabel } from "./color-picker.variants";
import { ColorPickerSheetInput } from "./color-picker-sheet";

type InputBlurEvent = Parameters<NonNullable<TextInputProps["onBlur"]>>[0];
type InputSubmitEvent = Parameters<NonNullable<TextInputProps["onSubmitEditing"]>>[0];

export type ColorPickerInputProps = Omit<
	InputProps,
	"value" | "defaultValue" | "onChangeText" | "size" | "variant" | "isDisabled" | "editable"
>;

/**
 * The hex field.
 *
 * Shows the settled colour as `#rrggbb` (or `#rrggbbaa`), and takes any notation
 * the picker accepts — a pasted `rgb(…)` or `hsl(…)` works, and is shown back as
 * hex once it lands.
 *
 * **It commits on blur and on submit, never per keystroke.** A half-typed `#f`
 * is not a colour on its way to being one; committing it would flash the area
 * to whatever `#f` parses as. **Text that is not a colour leaves the value
 * untouched** and turns the field invalid until it is corrected — the moment
 * the text parses again, the invalid state clears.
 *
 * Inside a sheet it is registered with the sheet, so the keyboard lifts the
 * panel instead of covering the field. Read-only makes it non-editable;
 * disabled, size and variant are the picker's.
 */
export function ColorPickerInput({
	accessibilityLabel,
	className,
	isInvalid,
	onBlur,
	onSubmitEditing,
	ref,
	...props
}: ColorPickerInputProps): ReactElement {
	const {
		hex,
		hsva,
		format,
		size,
		variant,
		isDisabled,
		isInvalid: pickerInvalid,
		isReadOnly,
		presentation,
		setHsva,
		inputRef,
	} = useColorPickerPart("ColorPicker.Input");
	const field = useFieldContext();
	const slots = colorPickerVariants({ size });

	const [text, setText] = useState(hex);
	const [isTextInvalid, setTextInvalid] = useState(false);

	// A new settled colour — from a drag, a swatch, or this field's own commit —
	// replaces whatever is typed. A commit lands here too, which is what turns a
	// pasted `rgb(255 0 0)` into `#ff0000`.
	useEffect(() => {
		setText(hex);
		setTextInvalid(false);
	}, [hex]);

	const commit = useCallback(() => {
		const parsed = parseColor(text);
		if (!parsed) {
			setTextInvalid(true);
			return;
		}
		setTextInvalid(false);
		if (isSameColor(text, hsva, format)) {
			setText(hex);
			return;
		}
		setHsva(preserveHue(parsed, hsva), { commit: true });
	}, [format, hex, hsva, setHsva, text]);

	const handleChangeText = useCallback(
		(next: string) => {
			setText(next);
			if (isTextInvalid && parseColor(next)) setTextInvalid(false);
		},
		[isTextInvalid]
	);

	const handleBlur = useCallback(
		(event: InputBlurEvent) => {
			commit();
			onBlur?.(event);
		},
		[commit, onBlur]
	);

	const handleSubmit = useCallback(
		(event: InputSubmitEvent) => {
			commit();
			onSubmitEditing?.(event);
		},
		[commit, onSubmitEditing]
	);

	const Field = presentation === "sheet" ? ColorPickerSheetInput : Input;

	return (
		<Field
			accessibilityLabel={resolveColorPickerLabel({
				label: field?.label,
				override: accessibilityLabel,
				part: "Hex colour",
			})}
			autoCapitalize="none"
			autoComplete="off"
			autoCorrect={false}
			className={slots.input({ className })}
			editable={!isReadOnly}
			isDisabled={isDisabled}
			isInvalid={isInvalid ?? (pickerInvalid || isTextInvalid)}
			onBlur={handleBlur}
			onChangeText={handleChangeText}
			onSubmitEditing={handleSubmit}
			placeholder="#000000"
			ref={composeRefs(ref, inputRef)}
			returnKeyType="done"
			size={size}
			spellCheck={false}
			value={text}
			variant={variant}
			{...props}
		/>
	);
}
ColorPickerInput.displayName = "DelacourUI.ColorPicker.Input";
