import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { chartsDemos } from "@/demos/charts";

/** The engine on its own — `delacour-react-native-charts` with nothing themed in front of it. */
export default function ChartEngineGallery(): ReactElement {
	return <DemoGallery demos={chartsDemos} subtitle="Engine" title="Chart" />;
}
