import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { slideButtonDemos } from "@/demos/slide-button";

export default function SlideButtonGallery(): ReactElement {
	return <DemoGallery demos={slideButtonDemos} title="SlideButton" />;
}
