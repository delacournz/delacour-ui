import { type ReactElement, useCallback } from "react";
import { Button, type ButtonProps } from "../button";
import { useTimePickerPart } from "./time-picker.context";

export type TimePickerClearProps = Omit<ButtonProps, "onPress">;

/**
 * Sets the value back to `null` and closes the sheet. The default footer
 * draws it only when the root is `clearable`; written by hand it always shows.
 *
 * @example
 * <TimePicker.Clear variant="ghost" />
 */
export function TimePickerClear({
	children,
	className,
	variant = "tertiary",
	...props
}: TimePickerClearProps): ReactElement {
	const picker = useTimePickerPart("TimePicker.Clear");
	const { close, setValue } = picker;

	const handlePress = useCallback(() => {
		setValue(null);
		close();
	}, [close, setValue]);

	return (
		<Button className={className ?? "flex-1"} onPress={handlePress} variant={variant} {...props}>
			{children ?? <Button.Label>{picker.clearLabel}</Button.Label>}
		</Button>
	);
}
TimePickerClear.displayName = "DelacourUI.TimePicker.Clear";
