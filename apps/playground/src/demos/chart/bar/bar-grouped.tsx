import { Chart } from "delacour-react-native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Grouped bars",
	caption:
		"Two `Chart.Bar`s that are siblings share each step between them. Nothing names the group — being placed together is what groups them.",
	note: "That is also why a `Chart.Bar` wrapped in a component of your own never groups: the root collects its direct children, and a wrapper hides the bar from it.",
	capture: { align: "stretch" },
};

const DATA = [
	{ month: "Jan", desktop: 186, mobile: 80 },
	{ month: "Feb", desktop: 305, mobile: 200 },
	{ month: "Mar", desktop: 237, mobile: 120 },
	{ month: "Apr", desktop: 73, mobile: 190 },
	{ month: "May", desktop: 209, mobile: 130 },
	{ month: "Jun", desktop: 214, mobile: 140 },
];

const CONFIG = {
	desktop: { label: "Desktop" },
	mobile: { label: "Mobile" },
};

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} xKey="month">
			<Chart.Grid />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Bar yKey="desktop" />
			<Chart.Bar yKey="mobile" />
			<Chart.Legend />
		</Chart>
	);
}
