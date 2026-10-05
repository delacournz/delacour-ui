import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { tooltipDemos } from "@/demos/tooltip";

export default function TooltipGallery(): ReactElement {
	return <DemoGallery demos={tooltipDemos} title="Tooltip" />;
}
