import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { itemDemos } from "@/demos/item";

export default function ItemGallery(): ReactElement {
	return <DemoGallery demos={itemDemos} title="Item" />;
}
