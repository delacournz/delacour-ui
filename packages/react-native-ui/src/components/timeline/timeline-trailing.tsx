import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { useTimelineItemPart } from "./timeline.context";
import { timelineVariants } from "./timeline.variants";

export type TimelineTrailingProps = ViewProps & { className?: string };

/**
 * A right column beside a vertical event — an amount, a badge, an avatar. Lifted
 * out of the item's children wherever it is written; in a horizontal column it
 * renders in the content band.
 */
export function TimelineTrailing({ className, ...props }: TimelineTrailingProps): ReactElement {
	const { orientation, size, variant } = useTimelineItemPart("Timeline.Trailing");
	return <View className={timelineVariants({ orientation, size, variant }).trailing({ className })} {...props} />;
}
TimelineTrailing.displayName = "DelacourUI.Timeline.Trailing";
