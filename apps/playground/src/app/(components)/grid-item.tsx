import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { gridItemDemos } from "@/demos/grid-item";

export default function GridItemGallery(): ReactElement {
	return <DemoGallery demos={gridItemDemos} title="GridItem" />;
}
