import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { kpiDemos } from "@/demos/kpi";

export default function KpiGallery(): ReactElement {
	return <DemoGallery demos={kpiDemos} title="Kpi" />;
}
