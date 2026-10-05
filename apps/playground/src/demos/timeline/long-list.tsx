import { Text } from "@delacour/react-native-ui/text";
import { Timeline } from "@delacour/react-native-ui/timeline";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Long list",
	align: "stretch",
	caption:
		"`Timeline.List` virtualises two hundred events over a `FlatList`. It supplies each item's position and last-ness, so `renderItem` returns a bare `Timeline.Item`; `itemWidth` sizes the columns, collapses the quiet days to ticks and doubles as the snap table.",
};

type Day = { id: string; title: string; date: string } | { id: string; title: null; date: null };

const DAYS: readonly Day[] = Array.from({ length: 200 }, (_, index) =>
	index % 5 === 4
		? { id: `day-${index}`, title: null, date: null }
		: { id: `day-${index}`, title: `Reading ${index + 1}`, date: `Day ${index + 1}` }
);

export function Demo(): ReactElement {
	const [column, setColumn] = useState(0);

	return (
		<View className="gap-3">
			<Text.Caption color="muted" testID="timeline-long-list-column">
				Column {column + 1} of {DAYS.length}
			</Text.Caption>
			<Timeline.List
				data={DAYS}
				itemWidth={(day) => (day.title === null ? 24 : 140)}
				keyExtractor={(day) => day.id}
				onColumnChange={setColumn}
				orientation="horizontal"
				renderItem={({ item }) =>
					item.title === null ? (
						<Timeline.Item />
					) : (
						<Timeline.Item>
							<Timeline.Title>{item.title}</Timeline.Title>
							<Timeline.Date>{item.date}</Timeline.Date>
						</Timeline.Item>
					)
				}
				snap
				testID="timeline-long-list"
				value={120}
			/>
		</View>
	);
}
