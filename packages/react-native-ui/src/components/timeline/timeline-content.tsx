import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { Surface } from "../surface";
import { useTimelineItemPart } from "./timeline.context";
import { timelineVariants } from "./timeline.variants";

export type TimelineContentProps = ViewProps & { className?: string };

/**
 * An event's content — its header, description, meta and stats. Under the
 * `card` variant it is a `Surface` at the small inset, which the track's dot is
 * padded down to match; otherwise a plain grouping.
 *
 * Its presence is also what a horizontal column counts as content: a column
 * with nothing but a marker collapses to a tick.
 */
export function TimelineContent({ className, ...props }: TimelineContentProps): ReactElement {
	const { orientation, size, variant } = useTimelineItemPart("Timeline.Content");
	const body = timelineVariants({ orientation, size, variant }).body({ className });

	if (variant === "card") return <Surface className={body} padding="sm" {...props} />;
	return <View className={body} {...props} />;
}
TimelineContent.displayName = "DelacourUI.Timeline.Content";
