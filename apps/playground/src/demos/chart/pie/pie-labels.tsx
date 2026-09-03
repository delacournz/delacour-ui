import { PieChart } from "delacour-react-native-ui/chart";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Labels on the slices",
	caption:
		'`PieChart.Label` prints on every slice wide enough to hold one. The default is the share as a percentage; `format="value"` prints the number as written.',
	note: "Skia text in the chart's background colour, so it reads on any slice of the ramp. A slice under twelve degrees gets none — a label wider than its wedge lands on the neighbours.",
	capture: { align: "stretch" },
};

const DATA = [
	{ stage: "Won", deals: 48 },
	{ stage: "Open", deals: 31 },
	{ stage: "Lost", deals: 17 },
	{ stage: "Stale", deals: 4 },
];

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">Percent</Text>
				<PieChart data={DATA} nameKey="stage" size="sm" valueKey="deals">
					<PieChart.Slice />
					<PieChart.Label />
				</PieChart>
			</View>
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">Value</Text>
				<PieChart data={DATA} nameKey="stage" size="sm" valueKey="deals">
					<PieChart.Slice />
					<PieChart.Label format="value" />
				</PieChart>
			</View>
		</View>
	);
}
