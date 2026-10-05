import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { BottomSheet } from "../bottom-sheet";
import { useFieldContext } from "../field/field.context";
import { type TimePickerContextValue, TimePickerProvider } from "./time-picker.context";
import {
	currentTime,
	formatTime,
	resolveHourCycle,
	resolveInitialTime,
	resolveLocale,
	type TimeValue,
} from "./time-picker.time";
import type { TimePickerProps } from "./time-picker.types";
import { TIME_PICKER_DEFAULT_VISIBLE_ROWS } from "./time-picker.variants";
import { TimePickerClear } from "./time-picker-clear";
import { TimePickerContent } from "./time-picker-content";
import { TimePickerDone } from "./time-picker-done";
import { TimePickerIcon } from "./time-picker-icon";
import { TimePickerTrigger } from "./time-picker-trigger";
import { TimePickerValue } from "./time-picker-value";
import { TimePickerWheelSlot } from "./time-picker-wheel-slot";

function TimePickerRoot({
	value: valueProp,
	defaultValue = null,
	onValueChange,
	minTime,
	maxTime,
	minuteStep = 1,
	showSeconds = false,
	hourCycle = "auto",
	locale,
	format,
	placeholder = "Select time",
	presentation = "sheet",
	visibleRows = TIME_PICKER_DEFAULT_VISIBLE_ROWS,
	isOpen: isOpenProp,
	defaultOpen = false,
	onOpenChange,
	isDisabled,
	isReadOnly = false,
	isInvalid,
	variant = "primary",
	size = "md",
	title = "Select time",
	doneLabel = "Done",
	clearable = false,
	clearLabel = "Clear",
	accessibilityLabel,
	className,
	testID,
	children,
}: TimePickerProps): ReactElement {
	const field = useFieldContext();
	const resolvedDisabled = isDisabled ?? field?.isDisabled ?? false;
	const resolvedInvalid = isInvalid ?? field?.isInvalid ?? false;

	const [value, setValue] = useControllableState<TimeValue | null>({
		value: valueProp,
		defaultValue,
		onChange: onValueChange,
	});
	const [isOpen, setOpen] = useControllableState<boolean>({
		value: isOpenProp,
		defaultValue: defaultOpen,
		onChange: onOpenChange,
	});

	const resolvedLocale = useMemo(() => resolveLocale(locale), [locale]);
	const cycle = useMemo(
		() => (hourCycle === "auto" ? resolveHourCycle(resolvedLocale) : hourCycle),
		[hourCycle, resolvedLocale]
	);

	// Where an unset wheel starts. Re-read from the clock each time the sheet
	// opens, so a picker mounted at nine and opened at noon starts at noon.
	const initialTime = useCallback(
		() => resolveInitialTime(currentTime(), minuteStep, { minTime, maxTime }, showSeconds),
		[maxTime, minTime, minuteStep, showSeconds]
	);
	const [wheelTime, setWheelTime] = useState<TimeValue>(initialTime);

	useEffect(() => {
		if (isOpen && value === null) setWheelTime(initialTime());
	}, [initialTime, isOpen, value]);

	const open = useCallback(() => {
		if (resolvedDisabled || isReadOnly) return;
		setOpen(true);
	}, [isReadOnly, resolvedDisabled, setOpen]);

	const close = useCallback(() => setOpen(false), [setOpen]);

	// The sheet only ever asks to close — opening is the trigger's — but a
	// controlled `isOpen` must still hear about it, and a disabled picker must
	// not be opened by anything that bypasses the trigger.
	const handleOpenChange = useCallback(
		(next: boolean) => {
			if (next && (resolvedDisabled || isReadOnly)) return;
			setOpen(next);
		},
		[isReadOnly, resolvedDisabled, setOpen]
	);

	// Offered to an enclosing `Field`, so tapping its label opens the sheet.
	// Registered through a ref-backed trampoline, as `Switch` and `Checkbox` do,
	// so a changed `open` does not re-register and re-render the whole field.
	const openRef = useRef(open);
	openRef.current = open;
	const stableOpen = useCallback(() => openRef.current(), []);
	const registerPress = field?.registerPress;

	useEffect(() => {
		if (!registerPress || presentation !== "sheet") return;
		registerPress(stableOpen);
		return () => registerPress(null);
	}, [presentation, registerPress, stableOpen]);

	const display = useMemo(() => {
		if (value === null) return "";
		const context = { locale: resolvedLocale, hourCycle: cycle };
		return format ? format(value, context) : formatTime(value, context);
	}, [cycle, format, resolvedLocale, value]);

	const context = useMemo<TimePickerContextValue>(
		() => ({
			value,
			setValue,
			wheelTime,
			isOpen,
			open,
			close,
			hourCycle: cycle,
			locale: resolvedLocale,
			display,
			placeholder,
			isDisabled: resolvedDisabled,
			isInvalid: resolvedInvalid,
			isReadOnly,
			variant,
			size,
			title,
			doneLabel,
			clearLabel,
			clearable,
			accessibilityLabel: accessibilityLabel ?? field?.label ?? "Time",
			wheel: { minTime, maxTime, minuteStep, showSeconds, visibleRows },
		}),
		[
			accessibilityLabel,
			clearLabel,
			clearable,
			close,
			cycle,
			display,
			doneLabel,
			field?.label,
			isOpen,
			isReadOnly,
			maxTime,
			minTime,
			minuteStep,
			open,
			placeholder,
			resolvedDisabled,
			resolvedInvalid,
			resolvedLocale,
			setValue,
			showSeconds,
			size,
			title,
			value,
			variant,
			visibleRows,
			wheelTime,
		]
	);

	// Inline, the wheel is the whole control: no trigger, no sheet, and so no
	// optional engine at runtime — though the import above still needs it.
	if (presentation === "inline") {
		return (
			<TimePickerProvider value={context}>
				{children ?? <TimePickerWheelSlot className={className} testID={testID} />}
			</TimePickerProvider>
		);
	}

	return (
		<TimePickerProvider value={context}>
			<BottomSheet enableContentPanningGesture={false} isOpen={isOpen} onOpenChange={handleOpenChange}>
				{children ?? (
					<>
						<TimePickerTrigger className={className} testID={testID} />
						<TimePickerContent />
					</>
				)}
			</BottomSheet>
		</TimePickerProvider>
	);
}

/**
 * Picks a time of day on snapping wheels — hour, minute, optional second and,
 * on a 12-hour clock, AM/PM.
 *
 * **The value is always 24-hour.** `{ hour: 15, minute: 5 }` is 3:05 PM
 * whatever `hourCycle` and `locale` say; they change only how it reads. `null`
 * is "not set" and shows the placeholder.
 *
 * **It commits when a wheel comes to rest**, not on Done. Each settle is pulled
 * onto `minuteStep` and inside `minTime`/`maxTime` first, so `onValueChange`
 * only ever sees a time that could be picked. Done closes; with an untouched
 * wheel it commits the time it shows. Swiping the sheet away keeps the value.
 *
 * **`presentation="sheet"` needs `BottomSheetProvider` once at the app root**,
 * like any `BottomSheet`. The trigger is `Input`'s box, so it lines up with the
 * fields around it. `presentation="inline"` draws the wheel in place.
 *
 * Inside a `Field` it takes the field's invalid and disabled state, reads
 * `Field.Label` as its accessible name, and a tap on the label opens it.
 *
 * @example
 * <TimePicker minuteStep={5} onValueChange={setTime} value={time} />
 *
 * @example
 * <Field isInvalid={!!error}>
 *   <Field.Label>Reminder</Field.Label>
 *   <TimePicker onValueChange={setTime} value={time}>
 *     <TimePicker.Trigger>
 *       <TimePicker.Value placeholder="Select time" />
 *       <TimePicker.Icon />
 *     </TimePicker.Trigger>
 *     <TimePicker.Content title="Reminder time">
 *       <TimePicker.Wheel />
 *     </TimePicker.Content>
 *   </TimePicker>
 * </Field>
 *
 * @example
 * <TimePicker hourCycle={24} onValueChange={setTime} presentation="inline" value={time} />
 */
export const TimePicker = Object.assign(TimePickerRoot, {
	/** The field-shaped control that opens the sheet. `Input`'s box, value and clock inside. */
	Trigger: TimePickerTrigger,
	/** The trigger's text — the formatted time, or the placeholder. */
	Value: TimePickerValue,
	/** The trigger's glyph. A clock unless you pass another. */
	Icon: TimePickerIcon,
	/** The sheet: scrim, panel, title, body and a footer with Done. */
	Content: TimePickerContent,
	/** The wheel, wired to this picker's value and options. */
	Wheel: TimePickerWheelSlot,
	/** Closes the sheet, committing an untouched wheel's time. */
	Done: TimePickerDone,
	/** Sets the value to `null` and closes the sheet. */
	Clear: TimePickerClear,
	displayName: "DelacourUI.TimePicker",
});
