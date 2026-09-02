import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { chartDemos } from "@/demos/chart";

export default function ChartGallery(): ReactElement {
	return <DemoGallery demos={chartDemos} subtitle="Skia marks on the theme's series ramp" title="Chart" />;
}
