import { Chart } from "@delacour/native-ui/chart";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Grid and axes",
	caption:
		"Each is a part you place. The grid paints with `border` and the labels with `muted-foreground`, so both follow a pasted palette.",
	capture: { align: "stretch" },
};

const DATA = [
	{ q: "Q1", margin: 12.5 },
	{ q: "Q2", margin: 18.2 },
	{ q: "Q3", margin: 15.8 },
	{ q: "Q4", margin: 24.1 },
];

const CONFIG = { margin: { label: "Margin" } };

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">Grid only</Text>
				<Chart config={CONFIG} data={DATA} size="sm" xKey="q">
					<Chart.Grid />
					<Chart.Line yKey="margin" />
				</Chart>
			</View>
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">Grid, both axes</Text>
				<Chart config={CONFIG} data={DATA} size="sm" xKey="q">
					<Chart.Grid axis="both" />
					<Chart.YAxis />
					<Chart.XAxis />
					<Chart.Line yKey="margin" />
				</Chart>
			</View>
		</View>
	);
}
