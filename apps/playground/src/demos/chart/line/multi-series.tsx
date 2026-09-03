import { Chart } from "delacour-react-native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Several series",
	caption: "Key order in the `config` is both the draw order and the ramp order.",
	capture: { align: "stretch" },
};

const DATA = [
	{ month: "Jan", desktop: 42, mobile: 28, tablet: 12 },
	{ month: "Feb", desktop: 58, mobile: 36, tablet: 15 },
	{ month: "Mar", desktop: 51, mobile: 44, tablet: 11 },
	{ month: "Apr", desktop: 73, mobile: 51, tablet: 19 },
	{ month: "May", desktop: 68, mobile: 62, tablet: 22 },
	{ month: "Jun", desktop: 91, mobile: 74, tablet: 26 },
];

const CONFIG = {
	desktop: { label: "Desktop" },
	mobile: { label: "Mobile" },
	tablet: { label: "Tablet" },
};

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} xKey="month">
			<Chart.Grid />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Line yKey="desktop" />
			<Chart.Line yKey="mobile" />
			<Chart.Line yKey="tablet" />
		</Chart>
	);
}
