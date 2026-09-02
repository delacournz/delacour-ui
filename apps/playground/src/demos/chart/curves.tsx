import { CHART_CURVES, Chart } from "@delacour/native-ui/chart";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Curves",
	align: "stretch",
	caption: "How the line gets from one point to the next.",
	note: "`monotone` is the default: it is the only interpolating curve here that cannot overshoot, so a line through non-negative data never dips below zero and invents a loss that never happened.",
};

const DATA = [
	{ x: "1", y: 10 },
	{ x: "2", y: 62 },
	{ x: "3", y: 58 },
	{ x: "4", y: 12 },
	{ x: "5", y: 48 },
	{ x: "6", y: 44 },
];

const CONFIG = { y: { label: "Value" } };

function CurveRow({ curve }: { curve: (typeof CHART_CURVES)[number] }): ReactElement {
	return (
		<View className="gap-2">
			<Text className="text-xs text-muted-foreground">{curve}</Text>
			<Chart config={CONFIG} curve={curve} data={DATA} size="sm" xKey="x">
				<Chart.Grid />
				<Chart.Line yKey="y" />
			</Chart>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			{CHART_CURVES.map((curve) => (
				<CurveRow curve={curve} key={curve} />
			))}
		</View>
	);
}
