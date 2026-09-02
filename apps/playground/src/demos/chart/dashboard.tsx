import { Chart } from "@delacour/native-ui/chart";
import { ListGroup } from "@delacour/native-ui/list-group";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inside a card",
	align: "stretch",
	caption: "The composition someone actually writes: a chart in a `ListGroup`, above the rows it summarises.",
};

const DATA = [
	{ month: "Jul", spend: 1240 },
	{ month: "Aug", spend: 1580 },
	{ month: "Sep", spend: 1390 },
	{ month: "Oct", spend: 2140 },
	{ month: "Nov", spend: 1980 },
	{ month: "Dec", spend: 2610 },
];

const CONFIG = { spend: { label: "Spend" } };

export function Demo(): ReactElement {
	return (
		<ListGroup>
			<View className="gap-1 px-4 pt-4 w-full">
				<Text className="text-xs text-muted-foreground">Total spend</Text>
				<Text className="text-2xl font-semibold text-foreground">$10,940</Text>
			</View>
			<View className="px-2 pb-2 w-full">
				<Chart config={CONFIG} data={DATA} includeZero size="sm" xKey="month">
					<Chart.Area yKey="spend" />
					<Chart.Line yKey="spend" />
				</Chart>
			</View>
			<ListGroup.Item>Highest month — December</ListGroup.Item>
			<ListGroup.Item>Lowest month — July</ListGroup.Item>
		</ListGroup>
	);
}
