import type { ReactElement } from "react";
import { Text } from "../text";
import { useTimelineItemPart } from "./timeline.context";
import type { TimelineTextProps } from "./timeline.types";
import { TIMELINE_DESCRIPTION_TEXT_SIZE, timelineVariants } from "./timeline.variants";

export type TimelineDateProps = TimelineTextProps;

/** When the event happened — a muted caption in tabular figures, so a column of times does not jitter. */
export function TimelineDate({ className, size, ...props }: TimelineDateProps): ReactElement {
	const item = useTimelineItemPart("Timeline.Date");
	return (
		<Text.Caption
			className={timelineVariants({ orientation: item.orientation }).date({ className })}
			size={size ?? TIMELINE_DESCRIPTION_TEXT_SIZE[item.size]}
			{...props}
		/>
	);
}
TimelineDate.displayName = "DelacourUI.Timeline.Date";
