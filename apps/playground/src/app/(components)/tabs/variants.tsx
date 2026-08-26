import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { tabsVariantsDemos } from "@/demos/tabs/variants";

export default function TabsVariantsGallery(): ReactElement {
	return <DemoGallery demos={tabsVariantsDemos} subtitle="Variants" title="Tabs" />;
}
