import { Chart } from "@delacour/react-native-ui/chart";
import { GridItem } from "@delacour/react-native-ui/grid-item";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconCloud } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Backgrounds",
	caption:
		"`GridItem.Background` fills the tile behind its content and clips to its corner — here a chart, and an oversized glyph. It takes no touches, so the tile stays pressable across its whole face.",
};

const DATA = [
	{ day: "Mon", steps: 6200 },
	{ day: "Tue", steps: 8100 },
	{ day: "Wed", steps: 7400 },
	{ day: "Thu", steps: 9800 },
	{ day: "Fri", steps: 11200 },
	{ day: "Sat", steps: 12600 },
	{ day: "Sun", steps: 10400 },
];

const CONFIG = { steps: { label: "Steps" } };

export function Demo(): ReactElement {
	return (
		<GridItem.Group columns={2} rowHeight={140}>
			<GridItem colSpan={2} onPress={() => {}} testID="tile-steps">
				<GridItem.Background className="top-1/3">
					<Chart className="flex-1" config={CONFIG} data={DATA} frameClassName="flex-1" xKey="day">
						<Chart.Area yKey="steps" />
						<Chart.Line yKey="steps" />
					</Chart>
				</GridItem.Background>
				<GridItem.Title>Steps</GridItem.Title>
				<GridItem.Value>10,400</GridItem.Value>
			</GridItem>
			<GridItem testID="tile-weather" variant="muted">
				<GridItem.Background className="items-end justify-end">
					<View className="-mb-6 -me-6 opacity-15">
						<Icon className="size-28" icon={IconCloud} />
					</View>
				</GridItem.Background>
				<GridItem.Title>Wellington</GridItem.Title>
				<GridItem.Value>14°</GridItem.Value>
				<GridItem.Description>Cloudy</GridItem.Description>
			</GridItem>
			<GridItem testID="tile-rain" variant="outline">
				<GridItem.Title>Rain</GridItem.Title>
				<GridItem.Value>60%</GridItem.Value>
				<GridItem.Description>From 3 pm</GridItem.Description>
			</GridItem>
		</GridItem.Group>
	);
}
