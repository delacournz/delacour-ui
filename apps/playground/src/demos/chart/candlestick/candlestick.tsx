import { Chart } from "delacour-react-native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Candlestick",
	caption:
		"Open, high, low and close per day. A candle that closed up is `chart-1`, one that closed down is `chart-2` — the top of the same ramp every other chart wears.",
	note: "The `config` names the close field alone, so the legend and the readout name one price rather than four; the part reads the other three off its own props.",
	capture: { align: "stretch" },
};

const START = new Date(2026, 2, 2).getTime();
const DAY = 86_400_000;

const CANDLES = [
	[142.1, 145.8, 140.6, 144.9],
	[144.9, 147.2, 143.5, 146.4],
	[146.4, 146.9, 141.8, 142.3],
	[142.3, 143.6, 138.9, 139.7],
	[139.7, 144.1, 139.2, 143.8],
	[143.8, 148.5, 143.1, 147.9],
	[147.9, 149.3, 145.6, 146.2],
	[146.2, 146.2, 146.2, 146.2],
	[146.2, 151.4, 145.9, 150.8],
	[150.8, 153.0, 149.4, 152.1],
	[152.1, 152.6, 147.3, 148.0],
	[148.0, 150.2, 146.1, 149.5],
	[149.5, 154.7, 149.0, 154.2],
	[154.2, 156.1, 152.8, 153.6],
] as const;

const DATA = CANDLES.map(([open, high, low, close], index) => ({
	at: new Date(START + index * DAY),
	open,
	high,
	low,
	close,
}));

const CONFIG = { close: { label: "Close" } };

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} testID="chart-candlestick" xKey="at">
			<Chart.Grid />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Candlestick />
			<Chart.Tooltip.X />
			<Chart.Tooltip />
		</Chart>
	);
}
