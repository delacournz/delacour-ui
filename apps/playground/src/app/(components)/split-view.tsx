import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { splitViewDemos } from "@/demos/split-view";

export default function SplitViewGallery(): ReactElement {
	return <DemoGallery demos={splitViewDemos} title="SplitView" />;
}
