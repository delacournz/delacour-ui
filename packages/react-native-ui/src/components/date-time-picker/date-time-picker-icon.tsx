import type { ReactElement } from "react";
import { IconCalendarClock } from "../../icons/central";
import { datePickerVariants, resolveDatePickerIconColor } from "../date-picker/date-picker.variants";
import { Icon, type IconProps } from "../icon";
import { useDateTimePickerPart } from "./date-time-picker.context";

export type DateTimePickerIconProps = Partial<IconProps>;

/** The calendar-and-clock glyph at the trigger's end — muted, destructive while invalid. */
export function DateTimePickerIcon({
	className,
	color,
	icon = IconCalendarClock,
	...props
}: DateTimePickerIconProps): ReactElement {
	const picker = useDateTimePickerPart("DateTimePicker.Icon");

	return (
		<Icon
			className={datePickerVariants({ size: picker.size }).icon({ className })}
			color={color ?? resolveDatePickerIconColor(picker.isInvalid)}
			icon={icon}
			{...props}
		/>
	);
}
DateTimePickerIcon.displayName = "DelacourUI.DateTimePicker.Icon";
