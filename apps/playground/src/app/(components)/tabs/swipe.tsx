import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { tabsSwipeDemos } from "@/demos/tabs/swipe";

export default function TabsSwipeGallery(): ReactElement {
	return <DemoGallery demos={tabsSwipeDemos} subtitle="Swipe" title="Tabs" />;
}
