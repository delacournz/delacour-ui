import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { flowDemos } from "@/demos/flow";

export default function FlowGallery(): ReactElement {
	return <DemoGallery demos={flowDemos} title="Flow" />;
}
