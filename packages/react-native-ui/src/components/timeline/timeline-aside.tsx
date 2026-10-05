import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { Text } from "../text";
import { useTimelineItemPart } from "./timeline.context";
import { TIMELINE_DESCRIPTION_TEXT_SIZE, timelineVariants } from "./timeline.variants";

export type TimelineAsideProps = ViewProps & { className?: string };

/**
 * A left column beside a vertical event — a timestamp, a day. Fixed width and
 * right-aligned, so a column of times reads as one edge, and padded down to sit
 * level with the title's first line. Bare text becomes a muted caption.
 *
 * Lifted out of the item's children wherever it is written. A horizontal event
 * has no left column, so there it renders in the content band like any child.
 */
export function TimelineAside({ className, children, ...props }: TimelineAsideProps): ReactElement {
	const { orientation, size, variant } = useTimelineItemPart("Timeline.Aside");
	const content =
		typeof children === "string" || typeof children === "number" ? (
			<Text.Caption className="text-right tabular-nums" size={TIMELINE_DESCRIPTION_TEXT_SIZE[size]}>
				{children}
			</Text.Caption>
		) : (
			children
		);

	return (
		<View className={timelineVariants({ orientation, size, variant }).aside({ className })} {...props}>
			{content}
		</View>
	);
}
TimelineAside.displayName = "DelacourUI.Timeline.Aside";
