import { Text } from "@delacour/native-ui/text";
import type { ReactElement, ReactNode } from "react";
import { ScrollView, View } from "react-native";

export type AxisStripProps = {
	label: string;
	/**
	 * A line under the strip describing the current selection. Omit it where the
	 * tiles already carry their own names and a caption would only repeat one.
	 */
	caption?: string;
	children: ReactNode;
};

/**
 * An axis as a row of tiles rather than a row that opens a sheet.
 *
 * The three axes that use it — Style, Base Color, Theme — are the ones whose
 * options are judged *against each other* rather than read one at a time. A
 * sheet is the wrong instrument for that comparison: it shows one screenful at
 * a time with the app it is restyling hidden behind its own scrim, so every
 * comparison costs an open and a close. Inline, a tap repaints everything under
 * the strip and the axis can be walked end to end with nothing opening.
 *
 * The scroller bleeds into the screen's gutter so a tile is cut by the edge
 * rather than stopping short of it — the cheapest honest signal that the row
 * continues. Its content keeps the gutter as padding, so the first tile still
 * lines up with the cards below.
 */
export function AxisStrip({ label, caption, children }: AxisStripProps): ReactElement {
	return (
		<View className="gap-2">
			<Text.Label>{label}</Text.Label>
			<ScrollView
				className="-mx-screen-gutter"
				contentContainerClassName="gap-3 px-screen-gutter"
				horizontal
				showsHorizontalScrollIndicator={false}
			>
				{children}
			</ScrollView>
			{caption ? <Text.Caption color="muted">{caption}</Text.Caption> : null}
		</View>
	);
}
AxisStrip.displayName = "Playground.AxisStrip";
