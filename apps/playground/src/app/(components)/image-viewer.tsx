import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { imageViewerDemos } from "@/demos/image-viewer";

export default function ImageViewerGallery(): ReactElement {
	return <DemoGallery demos={imageViewerDemos} title="Image Viewer" />;
}
