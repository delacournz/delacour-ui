import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { chartPartsDemos } from "@/demos/chart/parts";

export default function ChartPartsGallery(): ReactElement {
	return <DemoGallery demos={chartPartsDemos} subtitle="Parts" title="Chart" />;
}
