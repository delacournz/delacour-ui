import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { frameDemos } from "@/demos/frame";

export default function FrameGallery(): ReactElement {
	return <DemoGallery demos={frameDemos} title="Frame" />;
}
