import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { tabsScrollingDemos } from "@/demos/tabs/scrolling";

export default function TabsScrollingGallery(): ReactElement {
	return <DemoGallery demos={tabsScrollingDemos} subtitle="Scrolling" title="Tabs" />;
}
