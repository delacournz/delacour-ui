import type { ReactElement } from "react";
import { Text } from "../text";
import { useTimelineItemPart } from "./timeline.context";
import type { TimelineTextProps } from "./timeline.types";
import { TIMELINE_DESCRIPTION_TEXT_SIZE, timelineVariants } from "./timeline.variants";

export type TimelineDescriptionProps = TimelineTextProps;

/** Supporting text under the header, one step below the title, muted in every state. */
export function TimelineDescription({ className, size, ...props }: TimelineDescriptionProps): ReactElement {
	const item = useTimelineItemPart("Timeline.Description");
	return (
		<Text.Caption
			className={timelineVariants({ orientation: item.orientation }).description({ className })}
			size={size ?? TIMELINE_DESCRIPTION_TEXT_SIZE[item.size]}
			{...props}
		/>
	);
}
TimelineDescription.displayName = "DelacourUI.Timeline.Description";
