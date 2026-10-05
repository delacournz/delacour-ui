import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { InputSize, InputVariant } from "../input/input.variants";
import type { HourCycle, TimeValue } from "./time-picker.time";
import type { TimePickerWheelOptions } from "./time-picker.types";

export type TimePickerContextValue = {
	/** The selected time, or `null` while none is set. */
	value: TimeValue | null;
	setValue: (value: TimeValue | null) => void;
	/**
	 * The time the wheel shows: the value, or — while it is `null` — where the
	 * wheel started, which is what Done commits when nobody touched it.
	 */
	wheelTime: TimeValue;
	/** Whether the sheet is open. */
	isOpen: boolean;
	/** Opens the sheet. Does nothing while disabled or read-only. */
	open: () => void;
	close: () => void;
	/** The resolved hour cycle — never `"auto"`. */
	hourCycle: HourCycle;
	/** The resolved locale. */
	locale: string;
	/** The value as the trigger shows it, or `""` while none is set. */
	display: string;
	placeholder: string;
	isDisabled: boolean;
	isInvalid: boolean;
	isReadOnly: boolean;
	variant: InputVariant;
	size: InputSize;
	title: string;
	doneLabel: string;
	clearLabel: string;
	clearable: boolean;
	/** The trigger's accessible name, already resolved through the field. */
	accessibilityLabel: string;
	/** What the bare wheel needs, gathered once so `TimePicker.Wheel` can spread it. */
	wheel: Required<Pick<TimePickerWheelOptions, "minuteStep" | "showSeconds" | "visibleRows">> &
		Pick<TimePickerWheelOptions, "minTime" | "maxTime">;
};

const TimePickerContext = createContext<TimePickerContextValue | null>(null);

/**
 * Supplies one picker's state to its parts.
 *
 * Its own module, importing nothing but React and types, so a part reads it
 * without importing `./time-picker` and closing a cycle (package rule 3).
 */
export function TimePickerProvider({
	value,
	children,
}: {
	value: TimePickerContextValue;
	children: ReactNode;
}): ReactElement {
	return <TimePickerContext value={value}>{children}</TimePickerContext>;
}
TimePickerProvider.displayName = "DelacourUI.TimePicker.Provider";

/** The enclosing picker's state, or null outside a `<TimePicker>`. */
export function useTimePickerContext(): TimePickerContextValue | null {
	return use(TimePickerContext);
}

/**
 * Reads the enclosing picker — for a custom trigger or footer that has to
 * open it, read it, or match it. Throws outside a `<TimePicker>`; use
 * {@link useTimePickerContext} where the picker is optional.
 */
export function useTimePicker(): TimePickerContextValue {
	const context = useTimePickerContext();
	if (!context) {
		throw new Error("useTimePicker must be called inside a <TimePicker>.");
	}
	return context;
}

/**
 * The enclosing picker, for a part that cannot work without one.
 *
 * Internal: not re-exported from `index.ts`. A caller wants
 * {@link useTimePicker}, whose error names the hook rather than a part.
 */
export function useTimePickerPart(component: string): TimePickerContextValue {
	const context = useTimePickerContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <TimePicker>.`);
	}
	return context;
}
