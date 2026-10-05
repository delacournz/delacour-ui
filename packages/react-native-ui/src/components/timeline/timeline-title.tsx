import type { ReactElement } from "react";
import {
	interpolateColor,
	type SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useThemeColor } from "../../hooks/use-theme-color";
import { Text } from "../text";
import { useTimelineItemPart, useTimelinePart } from "./timeline.context";
import type { TimelineTextProps } from "./timeline.types";
import { TIMELINE_READING_EDGE_MS, TIMELINE_TITLE_TEXT_SIZE, timelineVariants } from "./timeline.variants";

export type TimelineTitleProps = TimelineTextProps;

/**
 * The event's name — the first thing its merged accessibility element reads.
 *
 * Renders `Text.Label` at the timeline's own size step. Vertical, its colour
 * follows progress: muted ahead of the value. Horizontal, it is muted until its
 * column reaches the strip's reading edge, then fades to the foreground — see
 * `ReadingEdgeTitle`.
 */
export function TimelineTitle({ className, size, ...props }: TimelineTitleProps): ReactElement {
	const root = useTimelinePart("Timeline.Title");
	const item = useTimelineItemPart("Timeline.Title");
	const classes = timelineVariants({ orientation: item.orientation, status: item.status }).title({ className });
	const textSize = size ?? TIMELINE_TITLE_TEXT_SIZE[item.size];

	if (root.activeColumn) {
		return (
			<ReadingEdgeTitle
				activeColumn={root.activeColumn}
				className={classes}
				size={textSize}
				step={item.step}
				{...props}
			/>
		);
	}
	return <Text.Label className={classes} size={textSize} {...props} />;
}
TimelineTitle.displayName = "DelacourUI.Timeline.Title";

/**
 * A horizontal title whose colour moves from muted to the foreground while its
 * column is at the reading edge.
 *
 * Its colour is an animated style, not a class, because it travels — the trade
 * `Tabs.Label` makes. The target flips in an animated reaction to the strip's
 * shared column, so mounting a cell mid-scroll paints its colour at once rather
 * than fading in, and reduce motion snaps it. Internal.
 */
function ReadingEdgeTitle({
	activeColumn,
	step,
	style,
	...props
}: TimelineTitleProps & { activeColumn: SharedValue<number>; step: number }): ReactElement {
	const isReducedMotion = useReducedMotion();
	const muted = useThemeColor("muted-foreground") ?? "transparent";
	const foreground = useThemeColor("foreground") ?? "transparent";
	const progress = useSharedValue(0);

	useAnimatedReaction(
		() => (activeColumn.value === step ? 1 : 0),
		(target, previous) => {
			if (target === previous) return;
			const isFirstRun = previous === null;
			progress.value =
				isFirstRun || isReducedMotion ? target : withTiming(target, { duration: TIMELINE_READING_EDGE_MS });
		},
		[step, isReducedMotion]
	);

	const colorStyle = useAnimatedStyle(() => ({
		color: interpolateColor(progress.value, [0, 1], [muted, foreground]),
	}));

	return <Text.Label style={[colorStyle, style]} {...props} />;
}
ReadingEdgeTitle.displayName = "DelacourUI.Timeline.Title.ReadingEdge";
