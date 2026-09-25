import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { textareaDemos } from "@/demos/textarea";

export default function TextareaGallery(): ReactElement {
	return <DemoGallery demos={textareaDemos} title="Textarea" />;
}
