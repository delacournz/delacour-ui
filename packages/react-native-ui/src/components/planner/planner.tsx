import { type ReactElement, useCallback, useEffect, useMemo, useRef } from "react";
import { AccessibilityInfo, View, type ViewProps } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";
import { Card } from "../card";
import {
	type PlannerContextValue,
	type PlannerNavigationOrigin,
	type PlannerPendingPage,
	PlannerProvider,
} from "./planner.context";
import type { PlannerCategory, PlannerEntry } from "./planner.types";
import { groupEntriesByDay, type PlannerVariant, plannerVariants, resolveEntryLimit } from "./planner.variants";
import { PlannerAction } from "./planner-action";
import {
	addMonths,
	formatMonthTitle,
	fromDayKey,
	type PlannerWeekStart,
	resolveWeekStart,
	startOfMonth,
	toDayKey,
} from "./planner-dates";
import { PlannerDay } from "./planner-day";
import { PlannerDetails } from "./planner-details";
import { PlannerFooter } from "./planner-footer";
import { PlannerGrid } from "./planner-grid";
import { PlannerHeader } from "./planner-header";
import { PlannerLegend } from "./planner-legend";
import { PlannerNav } from "./planner-nav";
import { PlannerScroller } from "./planner-scroller";
import { PlannerSummary } from "./planner-summary";
import { PlannerTitle } from "./planner-title";
import { PlannerToday } from "./planner-today";
import { usePlannerToday } from "./use-planner-today";

export type PlannerProps = ViewProps & {
	/** The displayed month, controlled. Any day in it will do. */
	month?: Date;
	/** The month to open on, uncontrolled. Defaults to the month holding today. */
	defaultMonth?: Date;
	/** Called when the planner asks for another month — nav, swipe, `Today`, or the scroller passing a month. */
	onMonthChange?: (month: Date) => void;
	/** The selected day, controlled. `null` for none. */
	selected?: Date | null;
	/** The day selected at first, uncontrolled. */
	defaultSelected?: Date | null;
	/** Called as a day is selected, and with `null` as the selection clears — including when `Details` closes. */
	onSelectedChange?: (date: Date | null) => void;
	/** Called for every press on a day, before it is selected. Push a screen from here instead of using `Details`. */
	onDayPress?: (date: Date, entries: readonly PlannerEntry[]) => void;
	/** What falls on each day. Compared by local calendar day, never by timestamp. */
	entries?: readonly PlannerEntry[];
	/** The kinds of entry — their colours, legend rows and spoken names. */
	categories?: readonly PlannerCategory[];
	/** How a day draws its entries. Defaults to `default`. */
	variant?: PlannerVariant;
	/** Take the height the planner is given and share it between the weeks. What `calendar` needs. */
	fill?: boolean;
	/** Icons or blocks a day draws before "+N". Defaults to 2, or 3 for `calendar`. */
	entryLimit?: number;
	/** The weekday a week opens on — `0` is Sunday. `auto` asks the locale, falling back to Monday. Defaults to `auto`. */
	weekStartsOn?: PlannerWeekStart | "auto";
	/** A BCP 47 tag for the month and weekday names. Defaults to the device's. */
	locale?: string;
	/** Draw the neighbouring months' days at either end of the grid. Defaults to `true`. */
	showOutsideDays?: boolean;
	/** Draw the planner on a `Card`. Defaults to `true`. */
	isFramed?: boolean;
	className?: string;
};

function PlannerRoot({
	month: monthProp,
	defaultMonth,
	onMonthChange,
	selected: selectedProp,
	defaultSelected = null,
	onSelectedChange,
	onDayPress,
	entries = EMPTY_ENTRIES,
	categories = EMPTY_CATEGORIES,
	variant = "default",
	fill = false,
	entryLimit,
	weekStartsOn = "auto",
	locale,
	showOutsideDays = true,
	isFramed = true,
	className,
	children,
	...props
}: PlannerProps): ReactElement {
	const today = usePlannerToday();
	const todayKey = toDayKey(today);

	const [rawMonth, setRawMonth] = useControllableState<Date>({
		value: monthProp,
		defaultValue: startOfMonth(defaultMonth ?? today),
		onChange: onMonthChange,
	});
	const monthKey = toDayKey(startOfMonth(rawMonth));
	// Rebuilt from the key, so a parent handing a new `Date` for the same month
	// every render does not hand every part a new month.
	const month = useMemo(() => fromDayKey(monthKey), [monthKey]);

	const [selected, select] = useControllableState<Date | null>({
		value: selectedProp,
		defaultValue: defaultSelected,
		onChange: onSelectedChange,
	});

	const pendingRef = useRef<PlannerPendingPage | null>(null);

	const navigate = useCallback(
		(target: Date, origin: PlannerNavigationOrigin) => {
			const next = startOfMonth(target);
			const key = toDayKey(next);
			if (key === monthKey) return;
			pendingRef.current = { key, direction: key > monthKey ? 1 : -1, origin };
			setRawMonth(next);
		},
		[monthKey, setRawMonth]
	);
	const page = useCallback(
		(direction: -1 | 1, origin: PlannerNavigationOrigin = "nav") => navigate(addMonths(month, direction), origin),
		[month, navigate]
	);
	const goToToday = useCallback(() => navigate(today, "today"), [navigate, today]);
	const setMonth = useCallback((target: Date) => setRawMonth(startOfMonth(target)), [setRawMonth]);

	const entriesByDay = useMemo(() => groupEntriesByDay(entries), [entries]);

	const pressDay = useCallback(
		(date: Date) => {
			const key = toDayKey(date);
			onDayPress?.(date, entriesByDay.get(key) ?? EMPTY_ENTRIES);
			select(selected !== null && toDayKey(selected) === key ? null : date);
		},
		[entriesByDay, onDayPress, select, selected]
	);

	// Parts' effects run before this one, so the grid has already read which way
	// to slide; this clears the request once the month it named has arrived. A
	// month a controlled parent refused never arrives, and so is never announced.
	useEffect(() => {
		const pending = pendingRef.current;
		if (pending === null || pending.key !== monthKey) return;
		pendingRef.current = null;
		if (pending.origin !== "scroll") {
			AccessibilityInfo.announceForAccessibility(formatMonthTitle(month, locale));
		}
	}, [locale, month, monthKey]);

	const context = useMemo<PlannerContextValue>(
		() => ({
			month,
			setMonth,
			navigate,
			page,
			goToToday,
			selected,
			select,
			pressDay,
			entries,
			categories,
			entriesByDay,
			today,
			todayKey,
			variant,
			fill,
			entryLimit: resolveEntryLimit(variant, entryLimit),
			weekStartsOn: resolveWeekStart(locale, weekStartsOn),
			locale,
			showOutsideDays,
			isFramed,
			pendingRef,
		}),
		[
			month,
			setMonth,
			navigate,
			page,
			goToToday,
			selected,
			select,
			pressDay,
			entries,
			categories,
			entriesByDay,
			today,
			todayKey,
			variant,
			fill,
			entryLimit,
			weekStartsOn,
			locale,
			showOutsideDays,
			isFramed,
		]
	);

	const rootClassName = plannerVariants({ fill, isFramed, variant }).root({ className });

	return (
		<PlannerProvider value={context}>
			{isFramed ? (
				<Card className={rootClassName} {...props}>
					{children}
				</Card>
			) : (
				<View className={cn(rootClassName)} {...props}>
					{children}
				</View>
			)}
		</PlannerProvider>
	);
}

const EMPTY_ENTRIES: readonly PlannerEntry[] = [];
const EMPTY_CATEGORIES: readonly PlannerCategory[] = [];

/**
 * A month of days, each showing what falls on it.
 *
 * For a training plan, a content calendar, a habit log: entries are dated, a
 * category colours them, and each day shows a marker, an icon or two and a
 * count — or, in the `calendar` variant, each entry's name. It is a viewer of
 * entries, not a date picker: there is no range and no min or max.
 *
 * The grid is always six weeks, so paging never changes its height. `Nav`
 * pages a month, so does a horizontal swipe on the grid, and `Today` comes
 * back. Today is ringed and the selected day filled, and both can apply to one
 * day. Pressing a day calls `onDayPress`, then selects it; `Details` opens a
 * sheet of that day's entries while a day is selected, and closing it clears
 * the selection.
 *
 * Days are compared as local-calendar `YYYY-MM-DD` keys — never by timestamp —
 * so a daylight-saving night or a time zone never moves an entry to the
 * neighbouring day. Gregorian only.
 *
 * @example
 * <Planner categories={categories} entries={entries}>
 *   <Planner.Header>
 *     <Planner.Title />
 *     <Planner.Today />
 *     <Planner.Nav />
 *   </Planner.Header>
 *   <Planner.Grid />
 *   <Planner.Legend counts />
 *   <Planner.Details>{(date, dayEntries) => <SessionList entries={dayEntries} />}</Planner.Details>
 * </Planner>
 *
 * @example
 * <Planner entries={posts} fill variant="calendar">
 *   <Planner.Header>
 *     <Planner.Title />
 *     <Planner.Nav />
 *   </Planner.Header>
 *   <Planner.Scroller rowHeight={112} weeks={26} />
 * </Planner>
 */
export const Planner = Object.assign(PlannerRoot, {
	/** The top row — the month's name, and the controls pushed to the end. */
	Header: PlannerHeader,
	/** The displayed month's name. Follows the scroller's top week. */
	Title: PlannerTitle,
	/** Back to the current month. Disabled while it is the one shown. */
	Today: PlannerToday,
	/** Previous and next month. */
	Nav: PlannerNav,
	/** A ghost icon button for the header — add, filter, settings. */
	Action: PlannerAction,
	/** The month as six weeks of seven days. Swipe to page. */
	Grid: PlannerGrid,
	/** A virtualised, continuous list of weeks around the opening month. */
	Scroller: PlannerScroller,
	/** One day's button. The grid draws these; exported for a grid of your own. */
	Day: PlannerDay,
	/** Each category's colour and name, with this month's count when `counts`. */
	Legend: PlannerLegend,
	/** The month's total, as a line. Place it inside `Legend`. */
	Summary: PlannerSummary,
	/** The last row, inset to match the header. */
	Footer: PlannerFooter,
	/** A sheet of the selected day's entries — open while a day is selected. */
	Details: PlannerDetails,
	displayName: "DelacourUI.Planner",
});
