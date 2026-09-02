import { Chart } from "@delacour/native-ui/chart";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Nothing to draw",
	align: "stretch",
	caption: "An empty series, and a single point. Both are real states and neither is allowed to crash.",
	note: "With no rows the domain falls back to `[0, 1]`, so the axis still has something to say rather than collapsing to a point.",
};

const CONFIG = { y: { label: "Value" } };
const ONE_POINT = [{ x: "Only", y: 42 }];

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">No rows</Text>
				<Chart config={CONFIG} data={[]} size="sm" xKey="x">
					<Chart.Grid />
					<Chart.YAxis />
					<Chart.Line yKey="y" />
				</Chart>
			</View>
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">One row</Text>
				<Chart config={CONFIG} data={ONE_POINT} size="sm" xKey="x">
					<Chart.Grid />
					<Chart.YAxis />
					<Chart.Line yKey="y" />
				</Chart>
			</View>
		</View>
	);
}
