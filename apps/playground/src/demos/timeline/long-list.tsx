import { Timeline } from "@delacour/react-native-ui/timeline";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Long list",
	caption:
		"`Timeline.List` virtualises two hundred events over a `FlatList`. It supplies each item's position and last-ness, so `renderItem` returns a bare `Timeline.Item`.",
};

type Entry = { id: string; title: string; date: string };

const ENTRIES: readonly Entry[] = Array.from({ length: 200 }, (_, index) => ({
	id: `entry-${index}`,
	title: `Reading ${index + 1}`,
	date: `${String(Math.floor(index / 4) % 24).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`,
}));

export function Demo(): ReactElement {
	return (
		<View className="h-[480px]">
			<Timeline.List
				data={ENTRIES}
				keyExtractor={(entry) => entry.id}
				renderItem={({ item }) => (
					<Timeline.Item>
						<Timeline.Header>
							<Timeline.Title>{item.title}</Timeline.Title>
							<Timeline.Date>{item.date}</Timeline.Date>
						</Timeline.Header>
					</Timeline.Item>
				)}
				size="sm"
				testID="timeline-long-list"
				value={120}
				variant="compact"
			/>
		</View>
	);
}
