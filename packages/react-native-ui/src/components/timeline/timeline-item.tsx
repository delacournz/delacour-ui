import { Children, isValidElement, type ReactElement, type ReactNode, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import {
	type TimelineItemContextValue,
	TimelineItemProvider,
	useTimelineListItemContext,
	useTimelinePart,
} from "./timeline.context";
import {
	isTimelineRailComplete,
	resolveTimelineAccessibilityValue,
	resolveTimelineColumnWidth,
	resolveTimelineStatus,
	type TimelineTone,
	timelineVariants,
} from "./timeline.variants";
import { TimelineAside } from "./timeline-aside";
import { TimelineIndicator } from "./timeline-indicator";
import { TimelineTrack } from "./timeline-track";
import { TimelineTrailing } from "./timeline-trailing";

export type TimelineItemProps = Omit<ViewProps, "children"> & {
	/** This event's index, zero-based. Inside a `Timeline.List` the list supplies it. */
	step?: number;
	/**
	 * Overrides whether the event reads as done. `true` completes it wherever it
	 * sits; `false` leaves a passed event looking unfinished. Never demotes the
	 * current event.
	 */
	isCompleted?: boolean;
	/** What kind of event it is. Tints the marker; progress stays on the rail. */
	tone?: TimelineTone;
	/** Draws no trailing rail. Derived from the root's count, or the list's data, when omitted. */
	isLast?: boolean;
	/**
	 * A horizontal column's width in points. Default 160; a column with no content
	 * collapses to a 24-point tick. Inside a `Timeline.List`, `itemWidth` decides.
	 */
	width?: number;
	className?: string;
	children?: ReactNode;
};

/**
 * One event: its marker, the rail segment leaving it, and its content.
 *
 * One accessibility element — the marker, title, date and description merge
 * into one VoiceOver stop, read in order with `accessibilityValue.text` such as
 * "Event 2 of 6, completed, success" after it. Pass `accessibilityLabel` to name
 * it by something shorter than its whole text. An empty horizontal column is a
 * tick, and hidden.
 *
 * `step`, `isLast` and `width` all come from context inside a `Timeline.List`,
 * so a `renderItem` needs none of them; a prop still wins when written.
 */
export function TimelineItem({
	step: stepProp,
	isCompleted,
	tone = "default",
	isLast: isLastProp,
	width: widthProp,
	className,
	children,
	style,
	...props
}: TimelineItemProps): ReactElement {
	const root = useTimelinePart("Timeline.Item");
	const cell = useTimelineListItemContext();
	const { value, count, orientation, size, variant } = root;

	const step = stepProp ?? cell?.step ?? 0;
	if (process.env.NODE_ENV !== "production" && stepProp === undefined && cell === null) {
		console.warn("Timeline.Item: no step. Pass one, or render the item from a Timeline.List's renderItem.");
	}
	const isLast = isLastProp ?? cell?.isLast ?? step >= count - 1;
	const status = resolveTimelineStatus({ isCompleted, step, value });
	const isRailComplete = isTimelineRailComplete(step, value);

	const context = useMemo<TimelineItemContextValue>(
		() => ({ isLast, isRailComplete, orientation, size, status, step, tone, variant }),
		[isLast, isRailComplete, orientation, size, status, step, tone, variant]
	);

	const { indicator, aside, trailing, content } = useMemo(
		() => splitTimelineChildren(children, orientation === "vertical"),
		[children, orientation]
	);
	const hasContent = content.length > 0 || aside.length > 0 || trailing.length > 0;
	const slots = timelineVariants({ isLast, orientation, size, status, variant });

	const accessibilityValue = { text: resolveTimelineAccessibilityValue({ count, status, step, tone }) };

	if (orientation === "horizontal") {
		const width = cell?.width ?? resolveTimelineColumnWidth(widthProp, hasContent);
		return (
			<TimelineItemProvider value={context}>
				<View
					accessibilityElementsHidden={!hasContent}
					accessibilityValue={hasContent ? accessibilityValue : undefined}
					accessible={hasContent}
					className={slots.item({ className })}
					importantForAccessibility={hasContent ? "auto" : "no-hide-descendants"}
					style={[{ width }, style]}
					{...props}
				>
					<View className={slots.content()}>{content}</View>
					<TimelineTrack hasContent={hasContent} indicator={indicator} />
				</View>
			</TimelineItemProvider>
		);
	}

	return (
		<TimelineItemProvider value={context}>
			<View
				accessibilityValue={accessibilityValue}
				accessible
				className={slots.item({ className })}
				style={style}
				{...props}
			>
				{aside}
				<TimelineTrack hasContent indicator={indicator} />
				<View className={slots.content()}>{content}</View>
				{trailing}
			</View>
		</TimelineItemProvider>
	);
}
TimelineItem.displayName = "DelacourUI.Timeline.Item";

/**
 * Lifts an item's structural children out of its content column: the
 * `Timeline.Indicator` into the track, and — vertical only — a `Timeline.Aside`
 * to the left and a `Timeline.Trailing` to the right. A horizontal column has no
 * side columns, so there they stay in the content band where they were written.
 *
 * Lives here rather than in the root because it is the item that splits its own
 * children; the root imports it to size horizontal columns the same way.
 */
export function splitTimelineChildren(
	children: ReactNode,
	hasSideColumns: boolean
): { indicator: ReactNode | null; aside: ReactNode[]; trailing: ReactNode[]; content: ReactNode[] } {
	let indicator: ReactNode | null = null;
	const aside: ReactNode[] = [];
	const trailing: ReactNode[] = [];
	const content: ReactNode[] = [];

	for (const child of Children.toArray(children)) {
		if (isValidElement(child)) {
			if (indicator === null && child.type === TimelineIndicator) {
				indicator = child;
				continue;
			}
			if (hasSideColumns && child.type === TimelineAside) {
				aside.push(child);
				continue;
			}
			if (hasSideColumns && child.type === TimelineTrailing) {
				trailing.push(child);
				continue;
			}
		}
		content.push(child);
	}

	return { aside, content, indicator, trailing };
}

/** Whether an item's children hold anything to show besides its marker — what decides a column's collapse. */
export function hasTimelineContent(children: ReactNode): boolean {
	return splitTimelineChildren(children, false).content.length > 0;
}
