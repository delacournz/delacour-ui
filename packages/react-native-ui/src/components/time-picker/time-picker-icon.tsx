import type { ReactElement } from "react";
import { IconClock } from "../../icons/central";
import { Icon, type IconProps } from "../icon";
import { INPUT_DECORATOR_ICON_TOKEN, INPUT_INVALID_DECORATOR_ICON_TOKEN } from "../input/input.variants";
import { useTimePickerPart } from "./time-picker.context";
import { timePickerVariants } from "./time-picker.variants";

export type TimePickerIconProps = Partial<Pick<IconProps, "icon" | "color" | "className">>;

/**
 * The trigger's glyph — a clock unless you pass another. Sized and coloured
 * the way an `Input.Group` decorator is: `size-icon-*` at the picker's size,
 * muted, destructive while invalid.
 *
 * @example
 * <TimePicker.Icon icon={IconAlarmClock} />
 */
export function TimePickerIcon({ icon = IconClock, color, className }: TimePickerIconProps): ReactElement {
	const picker = useTimePickerPart("TimePicker.Icon");

	return (
		<Icon
			className={timePickerVariants({ size: picker.size }).icon({ className })}
			color={color ?? (picker.isInvalid ? INPUT_INVALID_DECORATOR_ICON_TOKEN : INPUT_DECORATOR_ICON_TOKEN)}
			icon={icon}
		/>
	);
}
TimePickerIcon.displayName = "DelacourUI.TimePicker.Icon";
