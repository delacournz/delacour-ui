import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { tabsCompositionDemos } from "@/demos/tabs/composition";

export default function TabsCompositionGallery(): ReactElement {
	return <DemoGallery demos={tabsCompositionDemos} subtitle="Composition" title="Tabs" />;
}
