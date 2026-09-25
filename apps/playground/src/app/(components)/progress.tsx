import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { progressDemos } from "@/demos/progress";

export default function ProgressGallery(): ReactElement {
	return <DemoGallery demos={progressDemos} title="Progress" />;
}
