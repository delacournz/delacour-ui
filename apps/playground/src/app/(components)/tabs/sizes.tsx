import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { tabsSizesDemos } from "@/demos/tabs/sizes";

export default function TabsSizesGallery(): ReactElement {
	return <DemoGallery demos={tabsSizesDemos} subtitle="Sizes" title="Tabs" />;
}
