import type { ReactElement } from "react";
import { cn } from "../../lib/cn";
import { Button, type ButtonProps } from "../button";
import { resolvePartTestID } from "../calendar/calendar.variants";
import { useDatePickerPart } from "./date-picker.context";

export type DatePickerClearProps = Omit<ButtonProps, "onPress">;

/** Empties the selection and reports it, leaving the sheet open for a fresh pick. Disabled while empty. */
export function DatePickerClear({
	children,
	className,
	isDisabled,
	testID,
	variant = "secondary",
	...props
}: DatePickerClearProps): ReactElement {
	const picker = useDatePickerPart("DatePicker.Clear");

	return (
		<Button
			className={cn("flex-1", className)}
			isDisabled={isDisabled ?? (!picker.hasValue || picker.isDisabled || picker.isReadOnly)}
			onPress={picker.clear}
			testID={testID ?? resolvePartTestID(picker.testID, "clear")}
			variant={variant}
			{...props}
		>
			{children ?? <Button.Label>{picker.clearLabel}</Button.Label>}
		</Button>
	);
}
DatePickerClear.displayName = "DelacourUI.DatePicker.Clear";
