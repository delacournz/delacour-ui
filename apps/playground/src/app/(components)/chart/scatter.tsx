import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { chartScatterDemos } from "@/demos/chart/scatter";

export default function ChartScatterGallery(): ReactElement {
	return <DemoGallery demos={chartScatterDemos} subtitle="Scatter" title="Chart" />;
}
