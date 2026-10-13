import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { tagInputDemos } from "@/demos/tag-input";

export default function TagInputGallery(): ReactElement {
	return <DemoGallery demos={tagInputDemos} title="TagInput" />;
}
