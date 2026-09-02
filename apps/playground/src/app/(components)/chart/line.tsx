import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { chartLineDemos } from "@/demos/chart/line";

export default function ChartLineGallery(): ReactElement {
	return <DemoGallery demos={chartLineDemos} subtitle="Line" title="Chart" />;
}
