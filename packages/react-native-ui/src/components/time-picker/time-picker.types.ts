import type { ReactNode } from "react";
import type { InputSize, InputVariant } from "../input/input.variants";
import type { HourCycle, TimeMinuteStep, TimeValue } from "./time-picker.time";
import type { TimePickerLayout, TimePickerPresentation, TimePickerVisibleRows } from "./time-picker.variants";

/** Formats the trigger's text. Gets the resolved locale and hour cycle, never `"auto"`. */
export type TimePickerFormat = (value: TimeValue, context: { locale: string; hourCycle: HourCycle }) => string;

/** The props the bare wheel and the root share — everything that decides which rows exist. */
export type TimePickerWheelOptions = {
	/** The earliest selectable time. Rows before it are dimmed and a wheel landing there moves off. */
	minTime?: TimeValue;
	/** The latest selectable time. */
	maxTime?: TimeValue;
	/** The minute wheel's granularity. A value off the step is rounded to it, not rejected. Default 1. */
	minuteStep?: TimeMinuteStep;
	/** Add a seconds wheel. Default `false`. */
	showSeconds?: boolean;
	/** 12 or 24, or `"auto"` to follow the locale. Display only — a stored value is always 24-hour. */
	hourCycle?: HourCycle | "auto";
	/** A BCP 47 tag. Defaults to the device's. Sets the trigger's format and the AM/PM words. */
	locale?: string;
	/** The trigger's box and the wheel's row height. Matches `Input`. Default `md`. */
	size?: InputSize;
	/** Rows the wheel shows at once. Odd, so one sits on the centre line. Default 5. */
	visibleRows?: TimePickerVisibleRows;
	/** Blocks every interaction. Inherited from an enclosing `Field` when the prop is absent. */
	isDisabled?: boolean;
};

export type TimePickerWheelProps = TimePickerWheelOptions & {
	/** The time the wheels show. `null` starts them at now, on the step and inside the bounds. */
	value: TimeValue | null;
	/** Fires each time a wheel comes to rest, with the time pulled onto the step and inside the bounds. */
	onValueChange: (value: TimeValue) => void;
	className?: string;
};

export type TimePickerProps = TimePickerWheelOptions & {
	/** The selected time, controlled. `null` is "not set" and shows the placeholder. */
	value?: TimeValue | null;
	/** The starting time, uncontrolled. */
	defaultValue?: TimeValue | null;
	/** Fires when a wheel comes to rest, when Done commits an untouched wheel, and when Clear empties it. */
	onValueChange?: (value: TimeValue | null) => void;
	/** Replaces the locale's own reading of the time on the trigger. */
	format?: TimePickerFormat;
	/** The trigger's text while no time is set. Default "Select time". */
	placeholder?: string;
	/** `sheet` puts a trigger on screen and the wheel in a bottom sheet; `inline` draws the wheel in place. */
	presentation?: TimePickerPresentation;
	/** The face. Only `wheel` ships. */
	layout?: TimePickerLayout;
	/** Whether the sheet is open, controlled. */
	isOpen?: boolean;
	/** Whether the sheet starts open, uncontrolled. */
	defaultOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	/** Shows the value but never opens the sheet. */
	isReadOnly?: boolean;
	/** Draws the trigger's destructive border. Inherited from an enclosing `Field` when absent. */
	isInvalid?: boolean;
	/** The trigger's box variant. Matches `Input`. Default `primary`. */
	variant?: InputVariant;
	/** The sheet's heading. Default "Select time". */
	title?: string;
	/** The sheet's confirm button. Default "Done". */
	doneLabel?: string;
	/** Add a Clear button to the sheet's footer, which sets the value back to `null`. Default `false`. */
	clearable?: boolean;
	/** The clear button's label. Default "Clear". */
	clearLabel?: string;
	/** The trigger's accessible name. Falls back to an enclosing `Field.Label`'s text, then "Time". */
	accessibilityLabel?: string;
	/** Lands on the trigger in a sheet, on the wheel inline. */
	className?: string;
	/** Omit for the default anatomy: a trigger with the value and a clock, and a sheet with the wheel. */
	children?: ReactNode;
};
