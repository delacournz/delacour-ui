import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, AppState, View } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useFieldContext } from "../field/field.context";
import { Surface } from "../surface";
import { type CalendarContextValue, CalendarProvider } from "./calendar.context";
import {
	addMonths,
	addYears,
	type CalendarDate,
	type CalendarSelectionState,
	clampDate,
	compareMonths,
	formatMonthYear,
	isDateDisabled as isDateDisabledBy,
	isSameMonth,
	nextSelection,
	today as readToday,
	resolveWeekStart,
	resolveYearSpan,
	startOfMonth,
} from "./calendar.date";
import type { CalendarProps, CalendarSelection } from "./calendar.types";
import {
	type CalendarView,
	calendarVariants,
	isDateSelected,
	isMonthInBounds,
	resolveCalendarAxes,
	resolveMonthBounds,
	resolveRangeRole,
} from "./calendar.variants";
import { CalendarCaption } from "./calendar-caption";
import { CalendarDay } from "./calendar-day";
import { CalendarGrid } from "./calendar-grid";
import { CalendarHeader } from "./calendar-header";
import { CalendarNav } from "./calendar-nav";
import { CalendarPicker } from "./calendar-picker";
import { CalendarWeekdays } from "./calendar-weekdays";

/** The controlled selection, as state — `undefined` while the caller leaves it uncontrolled. */
function controlledSelection(props: CalendarSelection): CalendarSelectionState | undefined {
	switch (props.mode) {
		case "multiple":
			return props.selected === undefined ? undefined : { mode: "multiple", value: props.selected };
		case "range":
			return props.selected === undefined ? undefined : { mode: "range", value: props.selected };
		default:
			return props.selected === undefined ? undefined : { mode: "single", value: props.selected };
	}
}

/** The starting selection while uncontrolled — empty in the mode's own shape. */
function defaultSelection(props: CalendarSelection): CalendarSelectionState {
	switch (props.mode) {
		case "multiple":
			return { mode: "multiple", value: props.defaultSelected ?? [] };
		case "range":
			return { mode: "range", value: props.defaultSelected ?? { start: null, end: null } };
		default:
			return { mode: "single", value: props.defaultSelected ?? null };
	}
}

/** Reports a new selection to the caller's `onSelect`, typed for its mode. */
function emitSelection(props: CalendarSelection, next: CalendarSelectionState): void {
	switch (props.mode) {
		case "multiple":
			if (next.mode === "multiple") props.onSelect?.(next.value);
			return;
		case "range":
			if (next.mode === "range") props.onSelect?.(next.value);
			return;
		default:
			if (next.mode === "single") props.onSelect?.(next.value);
	}
}

/** The day a selection opens on — the month a calendar starts in when nothing else names one. */
function anchorOf(selection: CalendarSelectionState): CalendarDate | null {
	switch (selection.mode) {
		case "single":
			return selection.value;
		case "multiple":
			return selection.value[0] ?? null;
		case "range":
			return selection.value.start;
	}
}

/**
 * Today, kept current: re-read whenever the app returns to the foreground, so a calendar left open
 * overnight marks the right day in the morning. An override wins and is never re-read.
 */
function useToday(override: CalendarDate | undefined): CalendarDate {
	const [current, setCurrent] = useState(readToday);
	useEffect(() => {
		if (override) return;
		const subscription = AppState.addEventListener("change", (status) => {
			if (status === "active") setCurrent(readToday());
		});
		return () => subscription.remove();
	}, [override]);
	return override ?? current;
}

function CalendarRoot(props: CalendarProps): ReactElement {
	const {
		variant,
		size,
		minDate,
		maxDate,
		disabled,
		isDisabled,
		isInvalid,
		isReadOnly,
		month,
		defaultMonth,
		onMonthChange,
		startMonth,
		endMonth,
		locale,
		weekStartsOn = "auto",
		captionLayout = "picker",
		showOutsideDays = true,
		selectOutsideDays = false,
		isBordered = false,
		swipeToPage = true,
		today: todayOverride,
		className,
		children,
		mode: _mode,
		selected: _selected,
		defaultSelected: _defaultSelected,
		onSelect: _onSelect,
		...viewProps
	} = props;

	const field = useFieldContext();
	const axes = resolveCalendarAxes({ field, own: { isDisabled, isInvalid, isReadOnly, size, variant } });
	const today = useToday(todayOverride);

	const handleSelectionChange = useCallback((next: CalendarSelectionState) => emitSelection(props, next), [props]);
	const [selection, setSelection] = useControllableState<CalendarSelectionState>({
		defaultValue: defaultSelection(props),
		onChange: handleSelectionChange,
		value: controlledSelection(props),
	});

	const monthBounds = useMemo(
		() => resolveMonthBounds({ endMonth, maxDate, minDate, startMonth }),
		[endMonth, maxDate, minDate, startMonth]
	);

	const handleMonthChange = useCallback((next: CalendarDate) => onMonthChange?.(next), [onMonthChange]);
	const [visibleMonthRaw, setVisibleMonth] = useControllableState<CalendarDate>({
		defaultValue: startOfMonth(
			clampDate(defaultMonth ?? anchorOf(selection) ?? today, monthBounds.first, monthBounds.last)
		),
		onChange: handleMonthChange,
		value: month ? startOfMonth(month) : undefined,
	});
	const visibleMonth = useMemo(() => startOfMonth(visibleMonthRaw), [visibleMonthRaw]);

	const [view, setView] = useState<CalendarView>("days");
	const [pageDirection, setPageDirection] = useState<-1 | 0 | 1>(0);

	const goToMonth = useCallback(
		(date: CalendarDate) => {
			const target = startOfMonth(clampDate(startOfMonth(date), monthBounds.first, monthBounds.last));
			if (isSameMonth(target, visibleMonth)) return;
			setPageDirection(0);
			setVisibleMonth(target);
		},
		[monthBounds.first, monthBounds.last, setVisibleMonth, visibleMonth]
	);

	const step = view === "months" ? 12 : 1;
	const prevMonth = view === "months" ? addYears(visibleMonth, -1) : addMonths(visibleMonth, -1);
	const nextMonth = view === "months" ? addYears(visibleMonth, 1) : addMonths(visibleMonth, 1);
	const canGoPrev =
		view === "months"
			? !monthBounds.first || prevMonth.year >= monthBounds.first.year
			: isMonthInBounds(prevMonth, monthBounds);
	const canGoNext =
		view === "months"
			? !monthBounds.last || nextMonth.year <= monthBounds.last.year
			: isMonthInBounds(nextMonth, monthBounds);

	const page = useCallback(
		(direction: -1 | 1) => {
			const target = addMonths(visibleMonth, direction * step);
			const held = startOfMonth(clampDate(target, monthBounds.first, monthBounds.last));
			if (compareMonths(held, visibleMonth) === 0) return;
			setPageDirection(view === "days" ? direction : 0);
			setVisibleMonth(held);
		},
		[monthBounds.first, monthBounds.last, setVisibleMonth, step, view, visibleMonth]
	);
	const goPrev = useCallback(() => page(-1), [page]);
	const goNext = useCallback(() => page(1), [page]);

	const isDateDisabled = useCallback(
		(date: CalendarDate) => isDateDisabledBy(date, { disabled, maxDate, minDate }),
		[disabled, maxDate, minDate]
	);

	const select = useCallback(
		(date: CalendarDate) => {
			if (axes.isDisabled || axes.isReadOnly || isDateDisabled(date)) return;
			setSelection(nextSelection(selection, date, isDateDisabled));
			if (!isSameMonth(date, visibleMonth)) {
				setPageDirection(compareMonths(date, visibleMonth) > 0 ? 1 : -1);
				setVisibleMonth(startOfMonth(date));
			}
		},
		[axes.isDisabled, axes.isReadOnly, isDateDisabled, selection, setSelection, setVisibleMonth, visibleMonth]
	);

	// The month is announced when it changes, never on mount — the caption already says it.
	const announced = useRef(visibleMonth);
	useEffect(() => {
		if (isSameMonth(announced.current, visibleMonth)) return;
		announced.current = visibleMonth;
		AccessibilityInfo.announceForAccessibility(formatMonthYear(visibleMonth, locale));
	}, [locale, visibleMonth]);

	const resolvedWeekStart = useMemo(
		() => (weekStartsOn === "auto" ? resolveWeekStart(locale) : weekStartsOn),
		[locale, weekStartsOn]
	);
	const yearSpan = useMemo(
		() => resolveYearSpan({ endMonth: monthBounds.last, startMonth: monthBounds.first, visible: today }),
		[monthBounds.first, monthBounds.last, today]
	);

	const context = useMemo<CalendarContextValue>(
		() => ({
			canGoNext,
			canGoPrev,
			captionLayout,
			goNext,
			goPrev,
			goToMonth,
			isDateDisabled,
			isDateSelected: (date) => isDateSelected(selection, date),
			isDisabled: axes.isDisabled,
			isInvalid: axes.isInvalid,
			isReadOnly: axes.isReadOnly,
			label: field?.label ?? null,
			locale,
			mode: selection.mode,
			monthBounds,
			pageDirection,
			rangeRole: (date) => (selection.mode === "range" ? resolveRangeRole(selection.value, date) : null),
			select,
			selectOutsideDays,
			selection,
			setView,
			showOutsideDays,
			size: axes.size,
			swipeToPage,
			today,
			variant: axes.variant,
			view,
			visibleMonth,
			weekStartsOn: resolvedWeekStart,
			yearSpan,
		}),
		[
			axes.isDisabled,
			axes.isInvalid,
			axes.isReadOnly,
			axes.size,
			axes.variant,
			canGoNext,
			canGoPrev,
			captionLayout,
			field?.label,
			goNext,
			goPrev,
			goToMonth,
			isDateDisabled,
			locale,
			monthBounds,
			pageDirection,
			resolvedWeekStart,
			select,
			selectOutsideDays,
			selection,
			showOutsideDays,
			swipeToPage,
			today,
			view,
			visibleMonth,
			yearSpan,
		]
	);

	const rootClassName = calendarVariants({ isDisabled: axes.isDisabled, size: axes.size }).root({ className });
	const body = children ?? (
		<>
			<CalendarHeader />
			<CalendarWeekdays />
			<CalendarGrid />
		</>
	);

	// A bordered calendar is a card on `Surface`; a bare one is a plain column, the way a sheet or a
	// `Card` embeds it without a second frame inside its own.
	return (
		<CalendarProvider value={context}>
			{isBordered ? (
				<Surface className={rootClassName} padding="sm" {...viewProps}>
					{body}
				</Surface>
			) : (
				<View className={rootClassName} {...viewProps}>
					{body}
				</View>
			)}
		</CalendarProvider>
	);
}

/**
 * An always-visible month grid for picking a day, several days or a range.
 *
 * **Three modes, one discriminant.** `mode="single"` (the default) holds one `CalendarDate` and a
 * tap on it clears it; `mode="multiple"` toggles days in and out of a sorted list; `mode="range"`
 * takes two taps, where a tap before the start moves the start and a range that would swallow a
 * disabled day restarts instead. `selected`/`onSelect` are typed for the mode named, and work
 * controlled or uncontrolled.
 *
 * **Dates are `CalendarDate`s** — `{ year, month, day }`, with no time zone to shift them.
 * `@delacour/react-native-ui/calendar` exports the helpers to make, compare, format and
 * serialise them; no date library is needed.
 *
 * **Always six weeks**, so the height and every column hold still while paging, including through
 * a February that fits in four. Swipe the grid or tap the arrows to page; with
 * `captionLayout="picker"` (the default) the caption opens a months view, then a years view.
 *
 * `minDate`/`maxDate` bound what can be picked and, unless `startMonth`/`endMonth` say otherwise,
 * how far paging goes. `disabled` takes further matchers: a date, a span, weekdays or a predicate.
 *
 * `isDisabled` and `isInvalid` cascade in from an enclosing `Field`, whose label names the grid.
 * The week starts where the locale says, and names come from `Intl`.
 *
 * @example
 * const [day, setDay] = useState<CalendarDate | null>(null);
 * <Calendar onSelect={setDay} selected={day} />
 *
 * @example
 * <Calendar mode="range" minDate={today()} onSelect={setStay} selected={stay} isBordered />
 *
 * @example
 * <Calendar disabled={[{ type: "weekday", days: [0, 6] }]} mode="multiple" />
 *
 * @example
 * <Calendar>
 *   <Calendar.Header>
 *     <Calendar.Caption />
 *     <Calendar.Nav direction="prev" />
 *     <Calendar.Nav direction="next" />
 *   </Calendar.Header>
 *   <Calendar.Weekdays format="narrow" />
 *   <Calendar.Grid />
 * </Calendar>
 */
export const Calendar = Object.assign(CalendarRoot, {
	/** The row above the grid — the arrows and the caption, or whatever it is given. */
	Header: CalendarHeader,
	/** A paging arrow that disables itself at the bound it points at. */
	Nav: CalendarNav,
	/** The month and year — a label, or the button that opens the jump views. */
	Caption: CalendarCaption,
	/** The weekday names, in column order. */
	Weekdays: CalendarWeekdays,
	/** The six weeks, the swipe that pages them, and the jump view over them. */
	Grid: CalendarGrid,
	/** One day. Give it children for custom content under the number. */
	Day: CalendarDay,
	/** The months and years jump views. The grid hosts it; exported for a custom grid. */
	Picker: CalendarPicker,
	displayName: "DelacourUI.Calendar",
});
