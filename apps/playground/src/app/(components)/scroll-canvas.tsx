import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { scrollCanvasDemos } from "@/demos/scroll-canvas";

export default function ScrollCanvasGallery(): ReactElement {
	return <DemoGallery demos={scrollCanvasDemos} subtitle="Four scroll effects" title="ScrollCanvas" />;
}
