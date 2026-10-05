import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { attachmentDemos } from "@/demos/attachment";

export default function AttachmentGallery(): ReactElement {
	return <DemoGallery demos={attachmentDemos} title="Attachment" />;
}
