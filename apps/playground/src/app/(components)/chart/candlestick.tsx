import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { chartCandlestickDemos } from "@/demos/chart/candlestick";

export default function ChartCandlestickGallery(): ReactElement {
	return <DemoGallery demos={chartCandlestickDemos} subtitle="Candlestick" title="Chart" />;
}
