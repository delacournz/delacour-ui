import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { BottomSheet } from "../bottom-sheet";
import { type CalendarDate, today } from "../calendar/calendar.date";
import { resolveDatePickerAxes, resolveTriggerState } from "../date-picker/date-picker.variants";
import { useFieldContext } from "../field/field.context";
import { playHaptic } from "../pressable";
import { currentTime, resolveHourCycle, resolveLocale, type TimeValue } from "../time-picker/time-picker.time";
import { type DateTimePickerContextValue, DateTimePickerProvider } from "./date-time-picker.context";
import type { DateTimePickerProps } from "./date-time-picker.types";
import {
	applyDate,
	applyTime,
	type DateTimeRules,
	type DateTimeValue,
	nearestAllowedDate,
	resolveCalendarBounds,
	timeBoundsForDate,
} from "./date-time-picker.value";
import {
	DATE_TIME_PICKER_DEFAULTS,
	type DateTimePickerSection,
	resolveDateTimeAccessibilityValue,
	resolveDateTimeAnnouncement,
	resolveDateTimeDisplay,
	resolveShouldAutoAdvance,
	resolveTimeReadout,
} from "./date-time-picker.variants";
import { DateTimePickerCalendar } from "./date-time-picker-calendar";
import { DateTimePickerClear } from "./date-time-picker-clear";
import { DateTimePickerContent } from "./date-time-picker-content";
import { DateTimePickerDone } from "./date-time-picker-done";
import { DateTimePickerIcon } from "./date-time-picker-icon";
import { DateTimePickerTime } from "./date-time-picker-time";
import { DateTimePickerTrigger } from "./date-time-picker-trigger";
import { DateTimePickerValue } from "./date-time-picker-value";

function DateTimePickerRoot({
	value: valueProp,
	defaultValue = null,
	onValueChange,
	minDateTime,
	maxDateTime,
	disabledDates,
	minuteStep = 1,
	hourCycle = "auto",
	showSeconds = false,
	locale,
	weekStartsOn = "auto",
	captionLayout = "picker",
	today: todayProp,
	format,
	placeholder = DATE_TIME_PICKER_DEFAULTS.placeholder,
	layout = "tabs",
	presentation = "sheet",
	isOpen: isOpenProp,
	defaultOpen = false,
	onOpenChange,
	isDisabled,
	isReadOnly,
	isInvalid,
	variant,
	size,
	title = DATE_TIME_PICKER_DEFAULTS.title,
	doneLabel = DATE_TIME_PICKER_DEFAULTS.doneLabel,
	clearLabel = DATE_TIME_PICKER_DEFAULTS.clearLabel,
	dateLabel = DATE_TIME_PICKER_DEFAULTS.dateLabel,
	timeLabel = DATE_TIME_PICKER_DEFAULTS.timeLabel,
	isClearable = false,
	accessibilityLabel,
	className,
	testID,
	children,
	...viewProps
}: DateTimePickerProps): ReactElement {
	const field = useFieldContext();
	const axes = resolveDatePickerAxes({ field, own: { isDisabled, isInvalid, isReadOnly, size, variant } });

	const [value, setValue] = useControllableState<DateTimeValue | null>({
		defaultValue,
		onChange: onValueChange,
		value: valueProp,
	});
	const [isOpen, setOpen] = useControllableState<boolean>({
		defaultValue: defaultOpen,
		onChange: onOpenChange,
		value: isOpenProp,
	});

	const resolvedLocale = useMemo(() => resolveLocale(locale), [locale]);
	const cycle = useMemo(
		() => (hourCycle === "auto" ? resolveHourCycle(resolvedLocale) : hourCycle),
		[hourCycle, resolvedLocale]
	);
	const rules = useMemo<DateTimeRules>(
		() => ({ disabled: disabledDates, maxDateTime, minDateTime }),
		[disabledDates, maxDateTime, minDateTime]
	);

	const [activeSection, setActiveSection] = useState<DateTimePickerSection>("date");
	const [isTimeExpanded, setTimeExpanded] = useState(false);
	const hasAdvanced = useRef(false);

	// Every opening starts on the Date tab with the stacked wheel shut, and may auto-advance once.
	// Keyed on the open state rather than done in `open`, so a controlled `isOpen` resets it too.
	useEffect(() => {
		if (!isOpen) return;
		setActiveSection("date");
		setTimeExpanded(false);
		hasAdvanced.current = false;
	}, [isOpen]);

	const setDate = useCallback(
		(date: CalendarDate) => {
			const next = applyDate(value, date, { minuteStep, now: currentTime(), rules, showSeconds });
			setValue(next);
			if (resolveShouldAutoAdvance({ hadValue: value !== null, hasAdvanced: hasAdvanced.current, layout })) {
				hasAdvanced.current = true;
				setActiveSection("time");
			}
		},
		[layout, minuteStep, rules, setValue, showSeconds, value]
	);

	const setTime = useCallback(
		(time: TimeValue) => {
			const next = applyTime(value, time, { rules, today: todayProp ?? today() });
			if (next) setValue(next);
		},
		[rules, setValue, todayProp, value]
	);

	const trigger = resolveTriggerState({ ...axes, isOpen });

	const open = useCallback(() => {
		if (!trigger.canOpen || presentation === "inline") return;
		setOpen(true);
	}, [presentation, setOpen, trigger.canOpen]);

	const close = useCallback(() => {
		if (isOpen) setOpen(false);
	}, [isOpen, setOpen]);

	const handleSheetOpenChange = useCallback(
		(next: boolean) => {
			if (next) open();
			else close();
		},
		[close, open]
	);

	const formatContext = useMemo(() => ({ hourCycle: cycle, locale: resolvedLocale }), [cycle, resolvedLocale]);

	const done = useCallback(() => {
		AccessibilityInfo.announceForAccessibility(resolveDateTimeAnnouncement(value, formatContext));
		playHaptic("light");
		close();
	}, [close, formatContext, value]);

	const clear = useCallback(() => {
		setValue(null);
		setActiveSection("date");
		hasAdvanced.current = false;
	}, [setValue]);

	// The label tap of an enclosing `Field` opens the sheet, through a ref-backed trampoline so a
	// changed `open` does not re-register and re-render the whole field.
	const openRef = useRef(open);
	openRef.current = open;
	const stableOpen = useCallback(() => openRef.current(), []);
	const registerPress = field?.registerPress;
	useEffect(() => {
		if (!registerPress || presentation === "inline") return;
		registerPress(stableOpen);
		return () => registerPress(null);
	}, [presentation, registerPress, stableOpen]);

	// The wheel's bounds: those of the chosen day, or — while empty — of the day a time pick would
	// land on, so the rows the wheel dims are the ones `setTime` would refuse.
	const wheelDate = useMemo(
		() => value?.date ?? nearestAllowedDate(todayProp ?? today(), rules),
		[rules, todayProp, value]
	);
	const wheelBounds = useMemo(
		() => (wheelDate ? (timeBoundsForDate(wheelDate, minDateTime, maxDateTime) ?? {}) : {}),
		[maxDateTime, minDateTime, wheelDate]
	);
	const calendarBounds = useMemo(() => resolveCalendarBounds(rules), [rules]);

	const display = useMemo(
		() => resolveDateTimeDisplay(value, { format, hourCycle: cycle, locale: resolvedLocale }),
		[cycle, format, resolvedLocale, value]
	);

	const context = useMemo<DateTimePickerContextValue>(
		() => ({
			accessibilityLabel: accessibilityLabel ?? field?.label ?? DATE_TIME_PICKER_DEFAULTS.accessibilityLabel,
			accessibilityValue: resolveDateTimeAccessibilityValue(value, formatContext),
			activeSection,
			calendar: {
				captionLayout,
				disabled: disabledDates,
				maxDate: calendarBounds.maxDate,
				minDate: calendarBounds.minDate,
				today: todayProp,
				weekStartsOn,
			},
			canOpen: trigger.canOpen,
			clear,
			clearLabel,
			close,
			dateLabel,
			display,
			done,
			doneLabel,
			hasValue: value !== null,
			hourCycle: cycle,
			isClearable,
			isDisabled: axes.isDisabled,
			isInvalid: axes.isInvalid,
			isOpen,
			isReadOnly: axes.isReadOnly,
			isTimeExpanded,
			layout,
			locale: resolvedLocale,
			open,
			placeholder,
			presentation,
			setActiveSection,
			setDate,
			setTime,
			setTimeExpanded,
			setValue,
			size: axes.size,
			testID,
			timeBoundsForDate: wheelBounds,
			timeLabel,
			timeReadout: resolveTimeReadout(value, formatContext),
			title,
			value,
			variant: axes.variant,
			wheel: { minuteStep, showSeconds },
		}),
		[
			accessibilityLabel,
			activeSection,
			axes.isDisabled,
			axes.isInvalid,
			axes.isReadOnly,
			axes.size,
			axes.variant,
			calendarBounds.maxDate,
			calendarBounds.minDate,
			captionLayout,
			clear,
			clearLabel,
			close,
			cycle,
			dateLabel,
			disabledDates,
			display,
			done,
			doneLabel,
			field?.label,
			formatContext,
			isClearable,
			isOpen,
			isTimeExpanded,
			layout,
			minuteStep,
			open,
			placeholder,
			presentation,
			resolvedLocale,
			setDate,
			setTime,
			setValue,
			showSeconds,
			testID,
			timeLabel,
			title,
			todayProp,
			trigger.canOpen,
			value,
			weekStartsOn,
			wheelBounds,
		]
	);

	// Inline, the panel is the whole control. In a sheet the engine's root holds the open state and
	// renders no view, so the trigger and the portal sit inside it as siblings. The content pan is
	// off: every vertical drag inside belongs to a wheel, and the handle still drags the sheet.
	if (presentation === "inline") {
		return (
			<DateTimePickerProvider value={context}>
				<View className={className} testID={testID} {...viewProps}>
					{children ?? <DateTimePickerContent />}
				</View>
			</DateTimePickerProvider>
		);
	}

	return (
		<DateTimePickerProvider value={context}>
			<BottomSheet enableContentPanningGesture={false} isOpen={isOpen} onOpenChange={handleSheetOpenChange}>
				<View className={className} testID={testID} {...viewProps}>
					{children ?? (
						<>
							<DateTimePickerTrigger />
							<DateTimePickerContent />
						</>
					)}
				</View>
			</BottomSheet>
		</DateTimePickerProvider>
	);
}

/**
 * One field for "when": a date and a time of day, picked together in one sheet with one Done.
 *
 * **The value is whole or `null`, never half.** `{ date, time }` — a `CalendarDate` and a 24-hour
 * `TimeValue`, wall-clock with no zone. The halves fill in either order: a day picked first takes
 * the time from the clock, rounded up onto `minuteStep`; a time picked first lands on today, or the
 * nearest day that can be picked. Every pick and every wheel settle reports a whole value; Done
 * only closes and announces it, and swiping the sheet away keeps it.
 *
 * **One window, not two pairs of bounds.** `minDateTime` and `maxDateTime` bound the calendar to
 * their days and the wheel to their times on those days only, so "from 9:15 on the 5th" still
 * allows 8:00 on the 6th. Moving the date re-clamps a time the new day rules out.
 *
 * **Two layouts.** `tabs` (the default) holds the calendar and the wheel behind Date and Time tabs
 * in one fixed panel that fits the shortest phone, and moves to Time once after the first date
 * pick. `stacked` draws the calendar, a hairline and a time row that opens the wheel beneath it.
 *
 * **The trigger is `DatePicker`'s**, which is `Input`'s box, so it lines up with the fields around
 * it. Inside a `Field` it takes the field's invalid and disabled state, reads `Field.Label` as its
 * accessible name, and a tap on the label opens it. `presentation="sheet"` needs
 * `BottomSheetProvider` once at the app root; `presentation="inline"` draws the panel in place.
 *
 * @example
 * const [when, setWhen] = useState<DateTimeValue | null>(null);
 * <DateTimePicker minuteStep={15} onValueChange={setWhen} value={when} />
 *
 * @example
 * <Field>
 *   <Field.Label>Appointment</Field.Label>
 *   <DateTimePicker minDateTime={fromNativeDate(new Date())} minuteStep={15} onValueChange={setWhen} value={when}>
 *     <DateTimePicker.Trigger />
 *     <DateTimePicker.Content title="Appointment">
 *       <DateTimePicker.Calendar />
 *       <DateTimePicker.Time />
 *     </DateTimePicker.Content>
 *   </DateTimePicker>
 * </Field>
 *
 * @example
 * <DateTimePicker hourCycle={24} layout="stacked" presentation="inline" />
 */
export const DateTimePicker = Object.assign(DateTimePickerRoot, {
	/** The `Input`-shaped control that opens the sheet. Holds the value and the icon unless given children. */
	Trigger: DateTimePickerTrigger,
	/** The value as text, or the placeholder. */
	Value: DateTimePickerValue,
	/** The calendar-and-clock glyph — muted, destructive while invalid. */
	Icon: DateTimePickerIcon,
	/** The sheet — or, inline, the card — laid out per `layout`. */
	Content: DateTimePickerContent,
	/** The date half: a single-day `Calendar`, bound to the picker. */
	Calendar: DateTimePickerCalendar,
	/** The time half: a readout row and `TimePicker`'s wheel, bound to the picker. */
	Time: DateTimePickerTime,
	/** Announces the value and closes the sheet. */
	Done: DateTimePickerDone,
	/** Sets the value to `null` and keeps the sheet open. */
	Clear: DateTimePickerClear,
	displayName: "DelacourUI.DateTimePicker",
});
