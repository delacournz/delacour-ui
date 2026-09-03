import { Chart } from "delacour-react-native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Stacked bars",
	caption:
		"Bars naming the same `stackId` stand on one another, first placed at the bottom, so the top of each column reads as the total.",
	note: "The stack is built in data space, not on the canvas, which is what lets the y domain cover the totals rather than the tallest single series. One stack per chart.",
	capture: { align: "stretch" },
};

const DATA = [
	{ month: "Jan", organic: 120, paid: 60, referral: 30 },
	{ month: "Feb", organic: 150, paid: 90, referral: 45 },
	{ month: "Mar", organic: 130, paid: 70, referral: 55 },
	{ month: "Apr", organic: 180, paid: 110, referral: 40 },
	{ month: "May", organic: 170, paid: 95, referral: 65 },
	{ month: "Jun", organic: 210, paid: 120, referral: 70 },
];

const CONFIG = {
	organic: { label: "Organic" },
	paid: { label: "Paid" },
	referral: { label: "Referral" },
};

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} xKey="month">
			<Chart.Grid />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Bar stackId="traffic" yKey="organic" />
			<Chart.Bar stackId="traffic" yKey="paid" />
			<Chart.Bar stackId="traffic" yKey="referral" />
			<Chart.Legend />
		</Chart>
	);
}
