import type { ReactElement } from "react";
import { IconCalendar1 } from "../../icons/central";
import { Icon, type IconProps } from "../icon";
import { useDatePickerPart } from "./date-picker.context";
import { datePickerVariants, resolveDatePickerIconColor } from "./date-picker.variants";

export type DatePickerIconProps = Partial<IconProps>;

/** The calendar glyph at the trigger's end — muted, destructive while invalid, sized on the icon scale. */
export function DatePickerIcon({
	className,
	color,
	icon = IconCalendar1,
	...props
}: DatePickerIconProps): ReactElement {
	const picker = useDatePickerPart("DatePicker.Icon");

	return (
		<Icon
			className={datePickerVariants({ size: picker.size }).icon({ className })}
			color={color ?? resolveDatePickerIconColor(picker.isInvalid)}
			icon={icon}
			{...props}
		/>
	);
}
DatePickerIcon.displayName = "DelacourUI.DatePicker.Icon";
