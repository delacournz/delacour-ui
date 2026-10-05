import type { ReactElement } from "react";
import { Text } from "../text";
import { useTimelineItemPart } from "./timeline.context";
import type { TimelineTextProps } from "./timeline.types";
import { timelineVariants } from "./timeline.variants";

export type TimelineMetaProps = TimelineTextProps;

/** A small line of detail under the description — a place, a person, a reference. Always the smallest step. */
export function TimelineMeta({ className, size, ...props }: TimelineMetaProps): ReactElement {
	const item = useTimelineItemPart("Timeline.Meta");
	return (
		<Text.Caption
			className={timelineVariants({ orientation: item.orientation }).meta({ className })}
			size={size ?? "xs"}
			{...props}
		/>
	);
}
TimelineMeta.displayName = "DelacourUI.Timeline.Meta";
