import { Text } from "@delacour/react-native-ui/text";
import { Timeline } from "@delacour/react-native-ui/timeline";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Horizontal",
	capture: { align: "stretch", flow: true, hero: true },
	caption:
		"A swipeable strip of columns. `snap` lands each fling on a column, `onColumnChange` and a selection haptic fire as a new one reaches the left edge.",
};

const SEASONS = [
	{ title: "Planted", date: "Sep" },
	{ title: "First leaves", date: "Oct" },
	{ title: "Flowering", date: "Dec" },
	{ title: "Fruit set", date: "Jan" },
	{ title: "Harvest", date: "Mar" },
] as const;

export function Demo(): ReactElement {
	const [column, setColumn] = useState(0);

	return (
		<View className="gap-3">
			<Text.Caption color="muted" testID="timeline-horizontal-column">
				Column {column + 1} of {SEASONS.length}
			</Text.Caption>
			<Timeline haptic onColumnChange={setColumn} orientation="horizontal" snap testID="timeline-horizontal" value={2}>
				{SEASONS.map((season, index) => (
					<Timeline.Item key={season.title} step={index} testID={`timeline-horizontal-${index}`}>
						<Timeline.Title>{season.title}</Timeline.Title>
						<Timeline.Date>{season.date}</Timeline.Date>
					</Timeline.Item>
				))}
			</Timeline>
		</View>
	);
}
