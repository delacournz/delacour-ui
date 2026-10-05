import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { Text } from "../text";
import { useTimelineItemPart } from "./timeline.context";
import { TIMELINE_TITLE_TEXT_SIZE, timelineVariants } from "./timeline.variants";

export type TimelineStatProps = Omit<ViewProps, "children"> & {
	/** What is measured — read first, small and muted. */
	label: string;
	/** The measurement. A string or number becomes a label in tabular figures. */
	value: ReactNode;
	className?: string;
};

/** One labelled figure inside `Timeline.Stats`. */
export function TimelineStat({ label, value, className, ...props }: TimelineStatProps): ReactElement {
	const { orientation, size } = useTimelineItemPart("Timeline.Stat");
	const shown =
		typeof value === "string" || typeof value === "number" ? (
			<Text.Label className="tabular-nums" size={size === "sm" ? "xs" : TIMELINE_TITLE_TEXT_SIZE.sm}>
				{value}
			</Text.Label>
		) : (
			value
		);

	return (
		<View className={timelineVariants({ orientation }).stat({ className })} {...props}>
			<Text.Caption size="xs">{label}</Text.Caption>
			{shown}
		</View>
	);
}
TimelineStat.displayName = "DelacourUI.Timeline.Stat";
