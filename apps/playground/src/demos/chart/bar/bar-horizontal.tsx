import { Chart } from "@delacour/native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Horizontal bars",
	caption:
		'`orientation="horizontal"` swaps the axis roles: the categories run up the left and the bars grow rightward from them.',
	note: "`Chart.YAxis` and `Chart.XAxis` keep their names. Each labels the axis it sits beside, whichever field that axis now carries — which is why the y axis here prints the categories.",
	capture: { align: "stretch" },
};

const DATA = [
	{ browser: "Chrome", visitors: 275 },
	{ browser: "Safari", visitors: 200 },
	{ browser: "Firefox", visitors: 187 },
	{ browser: "Edge", visitors: 173 },
	{ browser: "Other", visitors: 90 },
];

const CONFIG = { visitors: { label: "Visitors" } };

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} orientation="horizontal" xKey="browser">
			<Chart.Grid axis="x" />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Bar yKey="visitors" />
		</Chart>
	);
}
