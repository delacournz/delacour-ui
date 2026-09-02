import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { chartAreaDemos } from "@/demos/chart/area";

export default function ChartAreaGallery(): ReactElement {
	return <DemoGallery demos={chartAreaDemos} subtitle="Area" title="Chart" />;
}
