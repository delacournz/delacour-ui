import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { useTimelineItemPart } from "./timeline.context";
import { timelineVariants } from "./timeline.variants";

export type TimelineStatsProps = ViewProps & { className?: string };

/** A wrapping row of `Timeline.Stat`s under an event's text — a distance, a duration, a score. */
export function TimelineStats({ className, ...props }: TimelineStatsProps): ReactElement {
	const { orientation } = useTimelineItemPart("Timeline.Stats");
	return <View className={timelineVariants({ orientation }).stats({ className })} {...props} />;
}
TimelineStats.displayName = "DelacourUI.Timeline.Stats";
