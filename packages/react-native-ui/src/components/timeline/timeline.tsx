import { Children, isValidElement, type ReactElement, type ReactNode, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import { type TimelineContextValue, TimelineProvider } from "./timeline.context";
import type { TimelineAxesProps, TimelineOrientationProps } from "./timeline.types";
import {
	resolveTimelineColumnOffsets,
	resolveTimelineColumnWidth,
	TIMELINE_DEFAULT_SIZE,
	TIMELINE_DEFAULT_VALUE,
	TIMELINE_DEFAULT_VARIANT,
	timelineVariants,
} from "./timeline.variants";
import { TimelineAside } from "./timeline-aside";
import { TimelineContent } from "./timeline-content";
import { TimelineDate } from "./timeline-date";
import { TimelineDescription } from "./timeline-description";
import { TimelineHeader } from "./timeline-header";
import { TimelineIndicator } from "./timeline-indicator";
import { hasTimelineContent, TimelineItem, type TimelineItemProps } from "./timeline-item";
import { TimelineList } from "./timeline-list";
import { TimelineMasthead } from "./timeline-masthead";
import { TimelineMeta } from "./timeline-meta";
import { TimelineStat } from "./timeline-stat";
import { TimelineStats } from "./timeline-stats";
import { TimelineTitle } from "./timeline-title";
import { TimelineTrailing } from "./timeline-trailing";
import { useTimelineReadingEdge } from "./use-timeline-reading-edge";

export type TimelineProps = ViewProps &
	TimelineAxesProps &
	TimelineOrientationProps & {
		className?: string;
		children?: ReactNode;
	};

type VerticalProps = Extract<TimelineProps, { orientation?: "vertical" }>;
type HorizontalProps = Extract<TimelineProps, { orientation: "horizontal" }>;

/**
 * Sorts the root's direct children: mastheads, which a horizontal strip renders
 * above itself, and everything else in order. Counts the `Timeline.Item`s — the
 * count is what leaves the last event without a trailing rail — and sizes each
 * one's column with the same rule the item uses, so the snap table and the
 * columns cannot disagree.
 */
function partitionChildren(children: ReactNode): { mastheads: ReactNode[]; rest: ReactNode[]; widths: number[] } {
	const mastheads: ReactNode[] = [];
	const rest: ReactNode[] = [];
	const widths: number[] = [];

	for (const child of Children.toArray(children)) {
		if (isValidElement(child) && child.type === TimelineMasthead) {
			mastheads.push(child);
			continue;
		}
		if (isValidElement<TimelineItemProps>(child) && child.type === TimelineItem) {
			widths.push(resolveTimelineColumnWidth(child.props.width, hasTimelineContent(child.props.children)));
		}
		rest.push(child);
	}

	if (process.env.NODE_ENV !== "production" && widths.length === 0 && rest.length > 0) {
		console.warn(
			"Timeline: found no <Timeline.Item> among the direct children, so every event reads as the last and no rail is drawn. " +
				"Render the items directly, or from a .map(), rather than behind a wrapper component — or use Timeline.List."
		);
	}

	return { mastheads, rest, widths };
}

function TimelineVertical({
	value = TIMELINE_DEFAULT_VALUE,
	variant = TIMELINE_DEFAULT_VARIANT,
	size = TIMELINE_DEFAULT_SIZE,
	orientation: _orientation,
	className,
	children,
	...props
}: VerticalProps): ReactElement {
	const { widths } = useMemo(() => partitionChildren(children), [children]);
	const count = widths.length;

	const context = useMemo<TimelineContextValue>(
		() => ({ activeColumn: null, count, orientation: "vertical", size, value, variant }),
		[count, size, value, variant]
	);

	return (
		<TimelineProvider value={context}>
			<View className={timelineVariants({ orientation: "vertical", size }).root({ className })} {...props}>
				{children}
			</View>
		</TimelineProvider>
	);
}
TimelineVertical.displayName = "DelacourUI.Timeline.Vertical";

function TimelineHorizontal({
	value = TIMELINE_DEFAULT_VALUE,
	variant = TIMELINE_DEFAULT_VARIANT,
	size = TIMELINE_DEFAULT_SIZE,
	orientation: _orientation,
	snap = false,
	haptic = false,
	onColumnChange,
	contentContainerClassName,
	className,
	children,
	...props
}: HorizontalProps): ReactElement {
	const { mastheads, rest, widths } = useMemo(() => partitionChildren(children), [children]);
	const offsets = useMemo(() => resolveTimelineColumnOffsets(widths), [widths]);
	const { activeColumn, scrollHandler } = useTimelineReadingEdge({ haptic, offsets, onColumnChange });
	const count = widths.length;

	const context = useMemo<TimelineContextValue>(
		() => ({ activeColumn, count, orientation: "horizontal", size, value, variant }),
		[activeColumn, count, size, value, variant]
	);
	const slots = timelineVariants({ orientation: "horizontal", size });

	return (
		<TimelineProvider value={context}>
			<View className={slots.root({ className })} {...props}>
				{mastheads}
				<Animated.ScrollView
					contentContainerClassName={slots.strip({ className: contentContainerClassName })}
					decelerationRate={snap ? "fast" : "normal"}
					horizontal
					onScroll={scrollHandler}
					scrollEventThrottle={16}
					showsHorizontalScrollIndicator={false}
					snapToOffsets={snap ? offsets : undefined}
				>
					{rest}
				</Animated.ScrollView>
			</View>
		</TimelineProvider>
	);
}
TimelineHorizontal.displayName = "DelacourUI.Timeline.Horizontal";

function TimelineRoot(props: TimelineProps): ReactElement {
	if (props.orientation === "horizontal") return <TimelineHorizontal {...props} />;
	return <TimelineVertical {...props} />;
}

/**
 * A sequence of dated events — an order's history, a project's milestones, a
 * match's key moments. Read-only.
 *
 * **Progress is solid, kind is tinted.** `value` is the current event: those
 * before it are completed, those after upcoming, and the rail fills up to it. An
 * item's `tone` says what kind of event it was and tints its marker whatever its
 * progress, so an error three steps back stays an error.
 *
 * **The rail is drawn for you.** The root counts its `Timeline.Item`s and every
 * one but the last draws the segment to the next — nothing to place, nothing
 * left dangling. Vertical by default; `orientation="horizontal"` lays the events
 * out as a swipeable strip of columns whose reading edge reports the column
 * under it.
 *
 * For a long history, `Timeline.List` virtualises the same items over a list's
 * `data` and supplies each one's position, so a `renderItem` needs no `step`.
 *
 * @example
 * <Timeline value={1}>
 *   <Timeline.Item step={0} tone="success">
 *     <Timeline.Content>
 *       <Timeline.Header>
 *         <Timeline.Title>Order placed</Timeline.Title>
 *         <Timeline.Date>9:41</Timeline.Date>
 *       </Timeline.Header>
 *       <Timeline.Description>Paid by card</Timeline.Description>
 *     </Timeline.Content>
 *   </Timeline.Item>
 *   <Timeline.Item step={1}>
 *     <Timeline.Title>Packed</Timeline.Title>
 *   </Timeline.Item>
 * </Timeline>
 *
 * @example
 * <Timeline orientation="horizontal" snap haptic value={3} onColumnChange={setColumn}>
 *   {events.map((event, index) => (
 *     <Timeline.Item key={event.id} step={index}>…</Timeline.Item>
 *   ))}
 * </Timeline>
 */
export const Timeline = Object.assign(TimelineRoot, {
	/** One event — its marker, the rail leaving it, and its content, as one accessibility element. */
	Item: TimelineItem,
	/** The marker: a dot, a number, or an icon. Composed in automatically. */
	Indicator: TimelineIndicator,
	/** The event's content. A `Surface` under the `card` variant. */
	Content: TimelineContent,
	/** The title and date on one line. */
	Header: TimelineHeader,
	/** The event's name. */
	Title: TimelineTitle,
	/** When it happened, in tabular figures. */
	Date: TimelineDate,
	/** A line of supporting text. */
	Description: TimelineDescription,
	/** A small line of detail — a place, a person. */
	Meta: TimelineMeta,
	/** A right column beside a vertical event. */
	Trailing: TimelineTrailing,
	/** A left column beside a vertical event — a timestamp. */
	Aside: TimelineAside,
	/** A row of labelled figures. */
	Stats: TimelineStats,
	/** One labelled figure. */
	Stat: TimelineStat,
	/** A header row above the first event. */
	Masthead: TimelineMasthead,
	/** The same timeline, virtualised over a list's data. */
	List: TimelineList,
	displayName: "DelacourUI.Timeline",
});
