import { Chart } from "delacour-react-native-ui/chart";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Labels and square ends",
	caption:
		"`labels` prints each value against its bar, in the axis colour and the axis font. `rounded={false}` squares the value end.",
	note: "A grouped or stacked chart draws no labels whatever is passed — there is no room between the bars for them to read.",
	capture: { align: "stretch" },
};

const DATA = [
	{ q: "Q1", revenue: 48 },
	{ q: "Q2", revenue: 62 },
	{ q: "Q3", revenue: 55 },
	{ q: "Q4", revenue: 81 },
];

const CONFIG = { revenue: { label: "Revenue" } };

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">Labelled</Text>
				<Chart config={CONFIG} data={DATA} size="sm" xKey="q">
					<Chart.XAxis />
					<Chart.Bar labels={(value) => `$${value}k`} yKey="revenue" />
				</Chart>
			</View>
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">Square ends</Text>
				<Chart config={CONFIG} data={DATA} size="sm" xKey="q">
					<Chart.Grid />
					<Chart.YAxis />
					<Chart.XAxis />
					<Chart.Bar rounded={false} yKey="revenue" />
				</Chart>
			</View>
		</View>
	);
}
