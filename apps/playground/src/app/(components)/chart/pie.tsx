import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { chartPieDemos } from "@/demos/chart/pie";

export default function ChartPieGallery(): ReactElement {
	return <DemoGallery demos={chartPieDemos} subtitle="Pie" title="Chart" />;
}
