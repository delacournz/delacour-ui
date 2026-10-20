import type { ReactElement } from "react";
import { IconChevronBottom } from "../../icons/central";
import { useFieldContext } from "../field/field.context";
import { Icon } from "../icon";
import { INPUT_DECORATOR_ICON_TOKEN, resolveInputGroupClass } from "../input/input.variants";
import { Pressable, type PressableProps } from "../pressable";
import { Text } from "../text";
import { useColorPickerPart } from "./color-picker.context";
import { colorPickerVariants, resolveTriggerAccessibilityLabel } from "./color-picker.variants";
import { ColorPickerPreview } from "./color-picker-preview";

export type ColorPickerTriggerProps = Omit<PressableProps, "onPress" | "children"> & {
	className?: string;
};

/**
 * The row a `presentation="sheet"` picker shows on the page: a preview of the
 * colour, its hex, and a chevron. Tapping it opens the sheet.
 *
 * Drawn on Input's own box resolver, so it is the same height, border, fill and
 * invalid treatment as every text field beside it — the picker's `variant` and
 * `size` reach it exactly as they reach the hex field. Disabled and read-only
 * leave it visible and inert.
 *
 * The preview inside is told not to fade: the box already fades as a whole, and
 * fading both would leave the swatch at a quarter.
 */
export function ColorPickerTrigger({ className, accessibilityLabel, ...props }: ColorPickerTriggerProps): ReactElement {
	const { hex, size, variant, isDisabled, isInvalid, isReadOnly, isOpen, setOpen } =
		useColorPickerPart("ColorPicker.Trigger");
	const field = useFieldContext();
	const slots = colorPickerVariants({ size });

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel ?? resolveTriggerAccessibilityLabel({ hex, label: field?.label })}
			accessibilityRole="button"
			accessibilityState={{ disabled: isDisabled, expanded: isOpen }}
			className={resolveInputGroupClass({ className, isDisabled, isInvalid, size, variant })}
			disabled={isDisabled || isReadOnly}
			feedback="none"
			onPress={() => setOpen(true)}
			{...props}
		>
			<ColorPickerPreview className="opacity-100" />
			<Text className={slots.triggerLabel()} numberOfLines={1}>
				{hex}
			</Text>
			<Icon color={INPUT_DECORATOR_ICON_TOKEN} icon={IconChevronBottom} size={size} />
		</Pressable>
	);
}
ColorPickerTrigger.displayName = "DelacourUI.ColorPicker.Trigger";
