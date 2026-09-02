import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { chartBarDemos } from "@/demos/chart/bar";

export default function ChartBarGallery(): ReactElement {
	return <DemoGallery demos={chartBarDemos} subtitle="Bar" title="Chart" />;
}
