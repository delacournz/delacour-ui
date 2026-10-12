import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { useTimelineItemPart } from "./timeline.context";
import { timelineVariants } from "./timeline.variants";

export type TimelineHeaderProps = ViewProps & { className?: string };

/**
 * The title and the date. One baseline-aligned row in a vertical timeline, the
 * date pushed to the far edge; stacked in a horizontal column, where the width is
 * too narrow to share.
 */
export function TimelineHeader({ className, ...props }: TimelineHeaderProps): ReactElement {
	const { orientation, size, variant } = useTimelineItemPart("Timeline.Header");
	return <View className={timelineVariants({ orientation, size, variant }).header({ className })} {...props} />;
}
TimelineHeader.displayName = "DelacourUI.Timeline.Header";
