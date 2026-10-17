import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { Text } from "../text";
import { useTimelinePart } from "./timeline.context";
import { timelineVariants } from "./timeline.variants";

export type TimelineMastheadProps = Omit<ViewProps, "children"> & {
	/** Leading media — an avatar, a crest, an icon in a circle. */
	media?: ReactNode;
	/** An eyebrow above the title. */
	label?: string;
	title: string;
	className?: string;
};

/**
 * A header row above the first event — what the timeline is the history of.
 *
 * Announced as a header and read as one element, so a screen reader's rotor
 * stops on it. In a horizontal timeline the root renders it above the strip, so
 * it stays put while the columns scroll.
 */
export function TimelineMasthead({ media, label, title, className, ...props }: TimelineMastheadProps): ReactElement {
	const { orientation, size } = useTimelinePart("Timeline.Masthead");
	const slots = timelineVariants({ orientation, size });

	return (
		<View accessibilityRole="header" accessible className={slots.masthead({ className })} {...props}>
			{media}
			<View className={slots.mastheadText()}>
				{label ? <Text.Overline>{label}</Text.Overline> : null}
				<Text.Label size={size === "sm" ? "md" : "lg"} weight="semibold">
					{title}
				</Text.Label>
			</View>
		</View>
	);
}
TimelineMasthead.displayName = "DelacourUI.Timeline.Masthead";
