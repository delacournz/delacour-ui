import { Kpi, type KpiGoodDirection } from "@delacour/react-native-ui/kpi";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inline",
	caption:
		'`layout="inline"` sets the sparkline in a fixed column beside the number. Labels of every length, and the shapes still line up down the right-hand edge.',
	capture: { align: "stretch" },
};

type Metric = {
	id: string;
	title: string;
	value: string;
	change: number;
	goodDirection: KpiGoodDirection;
	data: readonly number[];
};

const METRICS: readonly Metric[] = [
	{
		id: "orders",
		title: "Orders",
		value: "1,284",
		change: 4.1,
		goodDirection: "up",
		data: [40, 42, 39, 45, 47, 46, 51],
	},
	{
		id: "customers",
		title: "New customers this month",
		value: "312",
		change: -2.6,
		goodDirection: "up",
		data: [52, 49, 50, 47, 46, 44, 45],
	},
	{
		id: "refunds",
		title: "Refunds",
		value: "0.8%",
		change: -12.5,
		goodDirection: "down",
		data: [14, 13, 12, 12, 10, 9, 8],
	},
];

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{METRICS.map((metric, index) => (
				<Kpi
					colorIndex={1}
					goodDirection={metric.goodDirection}
					key={metric.id}
					size="sm"
					testID={`kpi-inline-${index}`}
				>
					<Kpi.Content layout="inline">
						<Kpi.Stat>
							<Kpi.Title>{metric.title}</Kpi.Title>
							<Kpi.Value>{metric.value}</Kpi.Value>
							<Kpi.Trend value={metric.change} />
						</Kpi.Stat>
						<Kpi.Sparkline data={metric.data} />
					</Kpi.Content>
				</Kpi>
			))}
		</View>
	);
}
