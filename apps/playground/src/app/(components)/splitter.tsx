import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { splitterDemos } from "@/demos/splitter";

export default function SplitterGallery(): ReactElement {
	return <DemoGallery demos={splitterDemos} title="Splitter" />;
}
