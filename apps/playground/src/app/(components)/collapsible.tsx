import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { collapsibleDemos } from "@/demos/collapsible";

export default function CollapsibleGallery(): ReactElement {
	return <DemoGallery demos={collapsibleDemos} title="Collapsible" />;
}
