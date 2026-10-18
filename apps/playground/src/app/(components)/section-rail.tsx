import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { sectionRailDemos } from "@/demos/section-rail";

export default function SectionRailGallery(): ReactElement {
	return <DemoGallery demos={sectionRailDemos} title="Section rail" />;
}
