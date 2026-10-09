import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { contextMenuDemos } from "@/demos/context-menu";

export default function ContextMenuGallery(): ReactElement {
	return <DemoGallery demos={contextMenuDemos} title="ContextMenu" />;
}
