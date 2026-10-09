import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { progressButtonDemos } from "@/demos/progress-button";

export default function ProgressButtonGallery(): ReactElement {
	return <DemoGallery demos={progressButtonDemos} title="ProgressButton" />;
}
