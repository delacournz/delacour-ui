import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { useTimelineItemPart, useTimelinePart } from "./timeline.context";
import { timelineVariants } from "./timeline.variants";
import { TimelineIndicator } from "./timeline-indicator";

/**
 * An event's track: its indicator box, then the rail segment leaving it. Internal.
 *
 * Vertical, the segment runs down `flex-1` beside the content; horizontal, it
 * runs across to the column's right edge, where the next column's indicator
 * begins. The last event draws none. A horizontal column with no content draws a
 * tick in place of an indicator, coloured once the value has reached it.
 *
 * Hidden from assistive technology, like `Separator`: it restates the status the
 * item already announces.
 */
export function TimelineTrack({
	indicator,
	hasContent,
}: {
	indicator: ReactNode | null;
	hasContent: boolean;
}): ReactElement {
	const { value } = useTimelinePart("Timeline.Item");
	const { step, isLast, isRailComplete, orientation, size, variant } = useTimelineItemPart("Timeline.Item");
	const slots = timelineVariants({ isLast, isRailComplete, orientation, size, variant });
	const isTick = orientation === "horizontal" && !hasContent;

	return (
		<View accessibilityElementsHidden className={slots.track()} importantForAccessibility="no-hide-descendants">
			<View className={slots.indicatorBox()}>
				{isTick ? (
					<View className={timelineVariants({ isRailComplete: step <= value }).tick()} />
				) : (
					(indicator ?? <TimelineIndicator />)
				)}
			</View>
			{isLast ? null : <View className={slots.rail()} />}
		</View>
	);
}
TimelineTrack.displayName = "DelacourUI.Timeline.Item.Track";
