import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { swipeDemos } from "@/demos/swipe";

export default function SwipeGallery(): ReactElement {
	return <DemoGallery demos={swipeDemos} title="Swipe" />;
}
