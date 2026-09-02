import { defineDemoGroup } from "../../define-demo-group";
import * as candlestick from "./candlestick";

/** One demo: a fortnight of candles with the band and the readout. */
export const chartCandlestickDemos = defineDemoGroup("chart/candlestick", {
	candlestick,
});
