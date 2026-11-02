import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { useControllableState } from "../../hooks/use-controllable-state";
import { BottomSheet } from "../bottom-sheet";
import type { CalendarDateRange, CalendarSelectionState } from "../calendar/calendar.date";
import { useFieldContext } from "../field/field.context";
import { playHaptic } from "../pressable";
import { type DatePickerContextValue, DatePickerProvider } from "./date-picker.context";
import type { DatePickerProps, DatePickerSelectionProps } from "./date-picker.types";
import {
	type DatePickerMode,
	emptySelection,
	formatSelection,
	hasSelection,
	resolveAnnouncement,
	resolveCloseDelay,
	resolveDatePickerAxes,
	resolveDefaultPlaceholder,
	resolveIsClearable,
	resolveSelectionAccessibilityValue,
	resolveShouldClose,
	resolveTriggerState,
} from "./date-picker.variants";
import { DatePickerCalendar } from "./date-picker-calendar";
import { DatePickerClear } from "./date-picker-clear";
import { DatePickerContent } from "./date-picker-content";
import { DatePickerDone } from "./date-picker-done";
import { DatePickerIcon } from "./date-picker-icon";
import { DatePickerTrigger } from "./date-picker-trigger";
import { DatePickerValue } from "./date-picker-value";

/** The controlled value, as selection state — `undefined` while the caller leaves it uncontrolled. */
function controlledValue(props: DatePickerSelectionProps): CalendarSelectionState | undefined {
	switch (props.mode) {
		case "range":
			return props.value === undefined ? undefined : { mode: "range", value: props.value };
		case "multiple":
			return props.value === undefined ? undefined : { mode: "multiple", value: props.value };
		default:
			return props.value === undefined ? undefined : { mode: "single", value: props.value };
	}
}

/** The starting value while uncontrolled — empty in the mode's own shape. */
function defaultValue(props: DatePickerSelectionProps): CalendarSelectionState {
	switch (props.mode) {
		case "range":
			return props.defaultValue ? { mode: "range", value: props.defaultValue } : emptySelection("range");
		case "multiple":
			return props.defaultValue ? { mode: "multiple", value: props.defaultValue } : emptySelection("multiple");
		default:
			return { mode: "single", value: props.defaultValue ?? null };
	}
}

/** Reports a committed value to the caller's `onValueChange`, typed for its mode. */
function emitValue(props: DatePickerSelectionProps, next: CalendarSelectionState): void {
	switch (props.mode) {
		case "range":
			if (next.mode === "range") props.onValueChange?.(next.value);
			return;
		case "multiple":
			if (next.mode === "multiple") props.onValueChange?.(next.value);
			return;
		default:
			if (next.mode === "single") props.onValueChange?.(next.value);
	}
}

function DatePickerRoot(props: DatePickerProps): ReactElement {
	const {
		placeholder,
		format,
		formatRange,
		locale,
		weekStartsOn = "auto",
		captionLayout = "picker",
		minDate,
		maxDate,
		disabledDates,
		selectOutsideDays = false,
		today,
		presentation = "sheet",
		isOpen: isOpenProp,
		defaultOpen = false,
		onOpenChange,
		onClose,
		isDisabled,
		isReadOnly,
		isInvalid,
		variant,
		size,
		calendarSize = "md",
		title = "Select date",
		doneLabel = "Done",
		clearLabel = "Clear",
		isClearable,
		accessibilityLabel,
		className,
		children,
		testID,
		mode: _mode,
		value: _value,
		defaultValue: _defaultValue,
		onValueChange: _onValueChange,
		...viewProps
	} = props;

	const mode: DatePickerMode = props.mode ?? "single";
	const field = useFieldContext();
	const axes = resolveDatePickerAxes({ field, own: { isDisabled, isInvalid, isReadOnly, size, variant } });
	const isCalm = useCalmMotion();

	const handleValueChange = useCallback((next: CalendarSelectionState) => emitValue(props, next), [props]);
	const [value, setValue] = useControllableState<CalendarSelectionState>({
		defaultValue: defaultValue(props),
		onChange: handleValueChange,
		value: controlledValue(props),
	});

	const [isOpen, setOpen] = useControllableState<boolean>({
		defaultValue: defaultOpen,
		onChange: onOpenChange,
		value: isOpenProp,
	});

	// A half-picked range lives here, inside the sheet, until its second tap — so a caller never
	// sees a range with no end, and a dismissed sheet leaves the last complete range standing.
	const [rangeDraft, setRangeDraft] = useState<CalendarDateRange | null>(null);
	const shown: CalendarSelectionState = rangeDraft ? { mode: "range", value: rangeDraft } : value;

	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const cancelPendingClose = useCallback(() => {
		if (closeTimer.current === null) return;
		clearTimeout(closeTimer.current);
		closeTimer.current = null;
	}, []);
	useEffect(() => cancelPendingClose, [cancelPendingClose]);

	const trigger = resolveTriggerState({ ...axes, isOpen });

	const open = useCallback(() => {
		if (!trigger.canOpen || presentation === "inline") return;
		setOpen(true);
	}, [presentation, setOpen, trigger.canOpen]);

	const close = useCallback(() => {
		cancelPendingClose();
		setRangeDraft(null);
		if (isOpen) setOpen(false);
	}, [cancelPendingClose, isOpen, setOpen]);

	const handleSheetOpenChange = useCallback(
		(next: boolean) => {
			if (next) {
				open();
				return;
			}
			close();
		},
		[close, open]
	);

	const finish = useCallback(
		(next: CalendarSelectionState) => {
			AccessibilityInfo.announceForAccessibility(resolveAnnouncement(next, locale));
			if (presentation === "inline") return;
			cancelPendingClose();
			const settle = () => {
				closeTimer.current = null;
				playHaptic("light");
				setOpen(false);
			};
			const delay = resolveCloseDelay(isCalm);
			if (delay === 0) settle();
			else closeTimer.current = setTimeout(settle, delay);
		},
		[cancelPendingClose, isCalm, locale, presentation, setOpen]
	);

	const select = useCallback(
		(next: CalendarSelectionState) => {
			if (next.mode === "range" && !resolveShouldClose(next)) {
				setRangeDraft(next.value);
				return;
			}
			setRangeDraft(null);
			setValue(next);
			if (resolveShouldClose(next)) finish(next);
		},
		[finish, setValue]
	);

	const clear = useCallback(() => {
		cancelPendingClose();
		setRangeDraft(null);
		setValue(emptySelection(mode));
	}, [cancelPendingClose, mode, setValue]);

	// The label tap of an enclosing `Field` opens the sheet, the way it toggles a `Switch`.
	const registerPress = field?.registerPress;
	useEffect(() => {
		if (!registerPress || presentation === "inline") return;
		registerPress(open);
		return () => registerPress(null);
	}, [open, presentation, registerPress]);

	const display = useMemo(
		() => formatSelection(shown, { format, formatRange, locale }),
		[format, formatRange, locale, shown]
	);

	const context = useMemo<DatePickerContextValue>(
		() => ({
			accessibilityLabel: accessibilityLabel ?? field?.label ?? "Date",
			accessibilityValue: resolveSelectionAccessibilityValue(shown, locale),
			calendar: {
				captionLayout,
				disabled: disabledDates,
				maxDate,
				minDate,
				selectOutsideDays,
				size: calendarSize,
				today,
				weekStartsOn,
			},
			canOpen: trigger.canOpen,
			clear,
			clearLabel,
			close,
			display,
			doneLabel,
			hasValue: hasSelection(shown),
			isClearable: resolveIsClearable(mode, isClearable),
			isDisabled: axes.isDisabled,
			isInvalid: axes.isInvalid,
			isOpen,
			isReadOnly: axes.isReadOnly,
			locale,
			mode,
			open,
			placeholder: placeholder ?? resolveDefaultPlaceholder(mode),
			presentation,
			select,
			testID,
			shown,
			size: axes.size,
			title,
			value,
			variant: axes.variant,
		}),
		[
			accessibilityLabel,
			axes.isDisabled,
			axes.isInvalid,
			axes.isReadOnly,
			axes.size,
			axes.variant,
			calendarSize,
			captionLayout,
			clear,
			clearLabel,
			close,
			disabledDates,
			display,
			doneLabel,
			field?.label,
			isClearable,
			isOpen,
			locale,
			maxDate,
			minDate,
			mode,
			open,
			placeholder,
			presentation,
			select,
			selectOutsideDays,
			shown,
			testID,
			title,
			today,
			trigger.canOpen,
			value,
			weekStartsOn,
		]
	);

	// Inline, the calendar is the whole control. In a sheet the engine's root holds the open state
	// and renders no view, so the trigger and the portal sit inside it as siblings.
	if (presentation === "inline") {
		return (
			<DatePickerProvider value={context}>
				<View className={className} testID={testID} {...viewProps}>
					{children ?? <DatePickerContent />}
				</View>
			</DatePickerProvider>
		);
	}

	return (
		<DatePickerProvider value={context}>
			<BottomSheet isOpen={isOpen} onOpenChange={handleSheetOpenChange} onClose={onClose}>
				<View className={className} testID={testID} {...viewProps}>
					{children ?? (
						<>
							<DatePickerTrigger />
							<DatePickerContent />
						</>
					)}
				</View>
			</BottomSheet>
		</DatePickerProvider>
	);
}

/**
 * A field-shaped control that shows a date — or a range, or several — and opens a bottom sheet
 * holding a `Calendar` to change it.
 *
 * **Three modes, one discriminant**, the calendar's own: `mode="single"` (the default) closes the
 * sheet the moment a day is picked; `mode="range"` holds the first tap inside the sheet and closes
 * once both ends exist, reporting only complete ranges; `mode="multiple"` reports every toggle and
 * stays open until Done. `value`/`onValueChange` are typed for the mode named, and work controlled
 * or uncontrolled; so do `isOpen`/`onOpenChange`.
 *
 * **The trigger is an `Input` box**, read from `inputVariants` rather than restated, so a picker
 * beside a text field matches it at every `size` and `variant`. Its text is derived from the value
 * — never stored — through `calendar.date`'s formatters; `format` and `formatRange` replace them.
 *
 * **Inside a `Field`** it takes `isInvalid` and `isDisabled`, names itself from `Field.Label`, and
 * a tap on the label opens the sheet. Read-only shows the value and never opens.
 *
 * The sheet engine is an optional peer: an app using this mounts `BottomSheetProvider` once.
 * `presentation="inline"` draws the calendar in place instead, with no trigger.
 *
 * @example
 * const [day, setDay] = useState<CalendarDate | null>(null);
 * <DatePicker onValueChange={setDay} value={day} />
 *
 * @example
 * <Field isInvalid={!!error}>
 *   <Field.Label>Check in / out</Field.Label>
 *   <DatePicker minDate={today()} mode="range" onValueChange={setStay} value={stay}>
 *     <DatePicker.Trigger />
 *     <DatePicker.Content title="Dates" />
 *   </DatePicker>
 *   <Field.Error>{error}</Field.Error>
 * </Field>
 *
 * @example
 * <DatePicker disabledDates={[{ type: "weekday", days: [0, 6] }]} mode="multiple" />
 */
export const DatePicker = Object.assign(DatePickerRoot, {
	/** The `Input`-shaped control that opens the sheet. Holds the value and the icon unless given children. */
	Trigger: DatePickerTrigger,
	/** The selection as text, or the placeholder. A half range ends on a dash and a muted "End". */
	Value: DatePickerValue,
	/** The calendar glyph — muted, destructive while invalid. */
	Icon: DatePickerIcon,
	/** The sheet: scrim, close, title, calendar and footer. Inline, the calendar in place. */
	Content: DatePickerContent,
	/** The `Calendar`, bound to the picker's value, bounds and finish rule. */
	Calendar: DatePickerCalendar,
	/** Closes the sheet. */
	Done: DatePickerDone,
	/** Empties the selection and keeps the sheet open. */
	Clear: DatePickerClear,
	displayName: "DelacourUI.DatePicker",
});
