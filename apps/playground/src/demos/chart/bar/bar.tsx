import { Chart } from "delacour-react-native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Bars",
	caption:
		"One bar per row, standing on zero. The value end follows `--radius` at the chart's size, so a squarer theme squares the bars too.",
	note: "Placing a `Chart.Bar` pulls zero into the y domain on its own — a bar that does not start at zero is a lie about its length.",
	capture: { align: "stretch" },
};

const DATA = [
	{ month: "Jan", orders: 186 },
	{ month: "Feb", orders: 305 },
	{ month: "Mar", orders: 237 },
	{ month: "Apr", orders: 273 },
	{ month: "May", orders: 209 },
	{ month: "Jun", orders: 314 },
];

const CONFIG = { orders: { label: "Orders" } };

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} testID="chart-bar" xKey="month">
			<Chart.Grid />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Bar yKey="orders" />
		</Chart>
	);
}
