import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { usePageHeaderPart, usePageHeaderStatsContext } from "./page-header.context";
import { formatStatCount, resolveStatLabel } from "./page-header.utils";
import { pageHeaderVariants } from "./page-header.variants";

export type PageHeaderStatProps = Omit<ViewProps, "children"> & {
	/** A number is compacted on screen (`1.2K`) and read in full; a string is drawn and read as given. */
	value: number | string;
	label: string;
	/** Makes the stat a button — open the followers list. */
	onPress?: () => void;
	className?: string;
};

/**
 * One number and what it counts.
 *
 * **Compaction is visual only.** `1234` draws as `1.2K` and is read as "1,234
 * Followers": the stat is one element to assistive technology, labelled with the
 * full number.
 *
 * **Content until it is given something to do.** With no `onPress` it is a
 * plain view; with one it is a `Pressable` announced as a button. Labels may run
 * to two lines in a stacked cell, so a large font scale wraps rather than
 * clipping.
 */
export function PageHeaderStat({ value, label, onPress, className, ...props }: PageHeaderStatProps): ReactElement {
	const { align } = usePageHeaderPart("PageHeader.Stat");
	const layout = usePageHeaderStatsContext()?.layout ?? "stacked";
	const slots = pageHeaderVariants({ align, layout });
	const drawn = typeof value === "number" ? formatStatCount(value) : value;
	const spoken = resolveStatLabel(value, label);

	const body = (
		<>
			<Text className={slots.statValue()} numberOfLines={1}>
				{drawn}
			</Text>
			<Text.Caption className={slots.statLabel()} numberOfLines={layout === "stacked" ? 2 : 1}>
				{label}
			</Text.Caption>
		</>
	);

	if (onPress) {
		return (
			<Pressable
				accessibilityLabel={spoken}
				accessibilityRole="button"
				className={slots.stat({ className })}
				onPress={onPress}
				{...props}
			>
				{body}
			</Pressable>
		);
	}

	return (
		<View accessibilityLabel={spoken} accessible className={slots.stat({ className })} {...props}>
			{body}
		</View>
	);
}
PageHeaderStat.displayName = "DelacourUI.PageHeader.Stat";
