import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { sectionProgressDemos } from "@/demos/section-progress";

export default function SectionProgressGallery(): ReactElement {
	return <DemoGallery demos={sectionProgressDemos} title="SectionProgress" />;
}
