import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { meterDemos } from "@/demos/meter";

export default function MeterGallery(): ReactElement {
	return <DemoGallery demos={meterDemos} title="Meter" />;
}
