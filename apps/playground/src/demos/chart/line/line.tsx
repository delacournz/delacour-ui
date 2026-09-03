import { Chart } from "delacour-react-native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A line",
	caption:
		"The `config` names each series and assigns the theme's ramp by position, so a mark names the data and never the paint.",
	capture: { align: "stretch", hero: true },
};

const DATA = [
	{ month: "Jan", revenue: 42 },
	{ month: "Feb", revenue: 58 },
	{ month: "Mar", revenue: 51 },
	{ month: "Apr", revenue: 73 },
	{ month: "May", revenue: 68 },
	{ month: "Jun", revenue: 91 },
];

const CONFIG = { revenue: { label: "Revenue" } };

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} testID="chart-line" xKey="month">
			<Chart.Grid />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Line yKey="revenue" />
		</Chart>
	);
}
