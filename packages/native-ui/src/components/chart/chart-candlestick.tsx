import { ChartCandlestick as EngineCandlestick } from "@delacour/charts";
import type { ReactElement } from "react";
import { useChart } from "./chart.context";
import type { ChartCandleColors, ChartCandlestickKeys } from "./chart.types";

export type ChartCandlestickProps = {
	/** The row field holding each price. Default to the conventional names. */
	open?: string;
	high?: string;
	low?: string;
	close?: string;
	/**
	 * Overrides the sentiment colours. Literals only.
	 *
	 * The defaults are `success`, `destructive` and `muted-foreground`,
	 * resolved in the root; a token here would reach the canvas unresolved.
	 */
	colors?: Partial<ChartCandleColors>;
	/** The fraction of each step a body fills. Defaults to 0.6. */
	bodyWidth?: number;
	/** The wick's stroke width in points. Defaults to 1. */
	wickWidth?: number;
	opacity?: number;
};

/**
 * Open-high-low-close candles, coloured by whether each closed up or down.
 *
 * The chart's `config` names the close field alone, so the legend and the
 * tooltip name one price rather than four; the root reads the other three
 * fields off this part and plots them for the engine. A rising candle is
 * `success` and a falling one `destructive` — the tokens those meanings
 * already have everywhere else — and a flat candle is `muted-foreground`.
 */
export function ChartCandlestick(props: ChartCandlestickProps): ReactElement {
	const { candleColors } = useChart();
	const { colors, bodyWidth, wickWidth, opacity } = props;

	return (
		<EngineCandlestick
			candleColors={{ ...candleColors, ...colors }}
			candleRatio={bodyWidth}
			keys={candlestickKeysOf(props)}
			opacity={opacity}
			wickStrokeWidth={wickWidth}
		/>
	);
}

ChartCandlestick.displayName = "DelacourUI.Chart.Candlestick";

/** The four field names, with the conventional defaults filled in. */
export function candlestickKeysOf(props: ChartCandlestickProps): ChartCandlestickKeys {
	return {
		open: props.open ?? "open",
		high: props.high ?? "high",
		low: props.low ?? "low",
		close: props.close ?? "close",
	};
}
