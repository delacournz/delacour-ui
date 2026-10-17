import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, type ListRenderItemInfo, View, type ViewToken } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { cn } from "../../lib/cn";
import { usePlannerPart } from "./planner.context";
import type { PlannerDayRenderer } from "./planner.types";
import { plannerVariants } from "./planner.variants";
import { buildWeekRange, isSameMonth, type PlannerWeek, startOfMonth, toDayKey } from "./planner-dates";
import { PlannerDay } from "./planner-day";
import { PlannerWeekdays } from "./planner-weekdays";

export type PlannerScrollerProps = {
	/** Weeks either side of the opening month's first week. Defaults to 26 — a year in all. */
	weeks?: number;
	/** Each week's height in points — fixed, so the list can jump to any week without measuring. Defaults to 112. */
	rowHeight?: number;
	/** Draws each day's content in place of the variant's. */
	renderDay?: PlannerDayRenderer;
	className?: string;
	/** Each day takes `${testID}-${YYYY-MM-DD}`; the list takes `testID` itself. */
	testID?: string;
};

/** A week counts as the top one once half of it is on screen. */
const VIEWABILITY = { itemVisiblePercentThreshold: 50 };

/**
 * A continuous, virtualised list of weeks around the opening month.
 *
 * A `FlatList` whose rows are all `rowHeight` tall, so `getItemLayout` places
 * any week without rendering the ones before it and a year of weeks costs a
 * screenful of views. The range is built once from the month the planner
 * opened on; scrolling moves the planner's month to that of the top visible
 * week — so `Title` follows the scroll — and `Nav` and `Today` scroll to the
 * week holding the 1st, or today.
 */
export function PlannerScroller({
	weeks = 26,
	rowHeight = 112,
	renderDay,
	className,
	testID,
}: PlannerScrollerProps): ReactElement {
	const { month, weekStartsOn, navigate, pendingRef, todayKey, fill, variant } = usePlannerPart("Planner.Scroller");
	const reduceMotion = useReducedMotion();
	const [anchor] = useState(month);
	const range = useMemo(() => buildWeekRange(anchor, weeks, weekStartsOn), [anchor, weeks, weekStartsOn]);
	const listRef = useRef<FlatList<PlannerWeek>>(null);
	const monthKey = toDayKey(month);

	useEffect(() => {
		const pending = pendingRef.current;
		if (pending === null || pending.key !== monthKey || pending.origin === "scroll") return;
		const target = pending.origin === "today" ? todayKey : monthKey;
		const index = range.weeks.findIndex((week) => week.days.some((day) => day.key === target));
		if (index >= 0) listRef.current?.scrollToIndex({ index, animated: !reduceMotion });
	}, [monthKey, pendingRef, range, reduceMotion, todayKey]);

	// `FlatList` refuses a new `onViewableItemsChanged`, so the handler is fixed
	// and reads the latest month and navigate through a ref.
	const latest = useRef({ month, navigate });
	useEffect(() => {
		latest.current = { month, navigate };
	}, [month, navigate]);
	const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<PlannerWeek>[] }) => {
		const top = viewableItems.find((token) => token.isViewable)?.item;
		if (!top || isSameMonth(top.month, latest.current.month)) return;
		latest.current.navigate(startOfMonth(top.month), "scroll");
	}).current;

	const getItemLayout = useCallback(
		(_: ArrayLike<PlannerWeek> | null | undefined, index: number) => ({
			length: rowHeight,
			offset: rowHeight * index,
			index,
		}),
		[rowHeight]
	);

	const slots = plannerVariants({ fill, variant });

	const renderItem = ({ item }: ListRenderItemInfo<PlannerWeek>): ReactElement => (
		<View className={slots.week()} style={{ height: rowHeight }}>
			{item.days.map((day) => (
				<PlannerDay
					className="aspect-auto h-auto min-h-0 flex-1"
					date={day.date}
					key={day.key}
					renderDay={renderDay}
					testID={testID === undefined ? undefined : `${testID}-${day.key}`}
				/>
			))}
		</View>
	);

	return (
		<View className={cn("gap-1", fill ? "flex-1" : "h-96", className)}>
			<PlannerWeekdays />
			<FlatList
				data={range.weeks}
				getItemLayout={getItemLayout}
				initialNumToRender={8}
				initialScrollIndex={range.initialIndex}
				keyExtractor={(week) => week.key}
				onViewableItemsChanged={onViewableItemsChanged}
				ref={listRef}
				renderItem={renderItem}
				showsVerticalScrollIndicator={false}
				testID={testID}
				viewabilityConfig={VIEWABILITY}
				windowSize={7}
			/>
		</View>
	);
}
PlannerScroller.displayName = "DelacourUI.Planner.Scroller";
