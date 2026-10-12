import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { timelineDemos } from "@/demos/timeline";

export default function TimelineGallery(): ReactElement {
	return <DemoGallery demos={timelineDemos} title="Timeline" />;
}
