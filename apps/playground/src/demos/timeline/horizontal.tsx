import { Text } from "@delacour/react-native-ui/text";
import { Timeline } from "@delacour/react-native-ui/timeline";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Horizontal",
	capture: { align: "stretch", flow: "timeline/horizontal", hero: true },
	caption:
		"A swipeable strip of columns. `snap` lands each fling on a column, `onColumnChange` and a selection haptic fire as a new one reaches the left edge, and a column with no content collapses to a tick.",
};

const SEASONS = [
	{ title: "Planted", date: "Sep" },
	{ title: "First leaves", date: "Oct" },
	null,
	{ title: "Flowering", date: "Dec" },
	{ title: "Fruit set", date: "Jan" },
	null,
	{ title: "Harvest", date: "Mar" },
] as const;

export function Demo(): ReactElement {
	const [column, setColumn] = useState(0);

	return (
		<View className="gap-3">
			<Text.Caption color="muted" testID="timeline-horizontal-column">
				Column {column + 1} of {SEASONS.length}
			</Text.Caption>
			<Timeline haptic onColumnChange={setColumn} orientation="horizontal" snap testID="timeline-horizontal" value={3}>
				{SEASONS.map((season, index) =>
					season === null ? (
						<Timeline.Item key={`gap-${index}`} step={index} />
					) : (
						<Timeline.Item key={season.title} step={index} testID={`timeline-horizontal-${index}`}>
							<Timeline.Title>{season.title}</Timeline.Title>
							<Timeline.Date>{season.date}</Timeline.Date>
						</Timeline.Item>
					)
				)}
			</Timeline>
		</View>
	);
}
