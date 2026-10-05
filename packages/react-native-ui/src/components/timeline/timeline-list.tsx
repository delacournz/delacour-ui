import { type ReactElement, useCallback, useMemo } from "react";
import type { FlatListProps, ListRenderItemInfo } from "react-native";
import Animated from "react-native-reanimated";
import { type TimelineContextValue, TimelineListItemProvider, TimelineProvider } from "./timeline.context";
import type { TimelineAxesProps, TimelineOrientationProps } from "./timeline.types";
import {
	resolveTimelineColumnOffsets,
	resolveTimelineItemLayout,
	resolveTimelineListWidths,
	TIMELINE_COLUMN_WIDTH,
	TIMELINE_DEFAULT_SIZE,
	TIMELINE_DEFAULT_VALUE,
	TIMELINE_DEFAULT_VARIANT,
	type TimelineItemWidth,
	timelineVariants,
} from "./timeline.variants";
import { useTimelineReadingEdge } from "./use-timeline-reading-edge";

type HorizontalOptions = Omit<Extract<TimelineOrientationProps, { orientation: "horizontal" }>, "orientation">;

type TimelineListBaseProps<T> = Omit<FlatListProps<T>, "renderItem" | "horizontal" | "onScroll"> &
	TimelineAxesProps & {
		/** Returns a `Timeline.Item`. The list supplies its `step`, `isLast` and `width`. */
		renderItem: (info: ListRenderItemInfo<T>) => ReactElement;
		/**
		 * Each horizontal column's width: one number, or a function of the item —
		 * return 24 for an empty column. It is also the snap table and
		 * `getItemLayout`, so a two-hundred column strip is never measured.
		 */
		itemWidth?: TimelineItemWidth<T>;
		className?: string;
	};

export type TimelineListProps<T> = TimelineListBaseProps<T> &
	(
		| ({ orientation?: "vertical" } & Pick<FlatListProps<T>, "onScroll">)
		| Extract<TimelineOrientationProps, { orientation: "horizontal" }>
	);

/**
 * The list behind both orientations, with the horizontal options settled. The
 * reading-edge hook runs either way — hooks cannot be conditional — and a vertical
 * list simply never attaches its handler. Internal.
 */
function TimelineListBody<T>({
	data,
	renderItem,
	itemWidth,
	value = TIMELINE_DEFAULT_VALUE,
	variant = TIMELINE_DEFAULT_VARIANT,
	size = TIMELINE_DEFAULT_SIZE,
	horizontal,
	onScroll,
	getItemLayout,
	className,
	contentContainerClassName,
	...props
}: TimelineListBaseProps<T> & {
	horizontal: HorizontalOptions | null;
	onScroll?: FlatListProps<T>["onScroll"];
}): ReactElement {
	const items = useMemo<T[]>(() => (data ? Array.from(data) : []), [data]);
	const widths = useMemo(() => resolveTimelineListWidths(items, itemWidth), [items, itemWidth]);
	const offsets = useMemo(() => resolveTimelineColumnOffsets(widths), [widths]);
	const isHorizontal = horizontal !== null;
	const { activeColumn, scrollHandler } = useTimelineReadingEdge({
		haptic: horizontal?.haptic ?? false,
		offsets,
		onColumnChange: horizontal?.onColumnChange,
	});
	const count = items.length;
	const orientation = isHorizontal ? "horizontal" : "vertical";

	const context = useMemo<TimelineContextValue>(
		() => ({ activeColumn: isHorizontal ? activeColumn : null, count, orientation, size, value, variant }),
		[activeColumn, count, isHorizontal, orientation, size, value, variant]
	);

	const renderCell = useCallback(
		(info: ListRenderItemInfo<T>) => (
			<TimelineListItemProvider
				value={{
					isLast: info.index === count - 1,
					step: info.index,
					width: widths[info.index] ?? TIMELINE_COLUMN_WIDTH,
				}}
			>
				{renderItem(info)}
			</TimelineListItemProvider>
		),
		[count, renderItem, widths]
	);

	const columnLayout = useCallback(
		(_: ArrayLike<T> | null | undefined, index: number) => resolveTimelineItemLayout(widths, offsets, index),
		[offsets, widths]
	);

	const strip = timelineVariants({ orientation: "horizontal", size }).strip({
		className: horizontal?.contentContainerClassName,
	});

	return (
		<TimelineProvider value={context}>
			<Animated.FlatList<T>
				{...props}
				className={className}
				contentContainerClassName={isHorizontal ? strip : contentContainerClassName}
				data={data}
				decelerationRate={horizontal?.snap ? "fast" : props.decelerationRate}
				getItemLayout={isHorizontal ? columnLayout : getItemLayout}
				horizontal={isHorizontal}
				onScroll={isHorizontal ? scrollHandler : onScroll}
				renderItem={renderCell}
				scrollEventThrottle={isHorizontal ? 16 : props.scrollEventThrottle}
				showsHorizontalScrollIndicator={isHorizontal ? false : props.showsHorizontalScrollIndicator}
				snapToOffsets={horizontal?.snap ? offsets : props.snapToOffsets}
			/>
		</TimelineProvider>
	);
}
TimelineListBody.displayName = "DelacourUI.Timeline.List.Body";

/**
 * A timeline virtualised over a list's `data` — a long history, two hundred
 * events, an infinite feed.
 *
 * It is the root and the list at once: it counts the data, supplies each cell's
 * `step`, `isLast` and column `width` through context, so a `renderItem`
 * returns a bare `Timeline.Item` with none of them. Horizontal, `itemWidth`
 * doubles as the snap table and `getItemLayout`, so no column is ever measured.
 *
 * @example
 * <Timeline.List
 *   data={events}
 *   value={latest}
 *   renderItem={({ item }) => (
 *     <Timeline.Item tone={item.tone}>
 *       <Timeline.Title>{item.title}</Timeline.Title>
 *     </Timeline.Item>
 *   )}
 * />
 */
export function TimelineList<T>(props: TimelineListProps<T>): ReactElement {
	if (props.orientation === "horizontal") {
		const { orientation: _orientation, snap, haptic, onColumnChange, contentContainerClassName, ...rest } = props;
		return <TimelineListBody<T> {...rest} horizontal={{ contentContainerClassName, haptic, onColumnChange, snap }} />;
	}
	const { orientation: _orientation, ...rest } = props;
	return <TimelineListBody<T> {...rest} horizontal={null} />;
}
TimelineList.displayName = "DelacourUI.Timeline.List";
