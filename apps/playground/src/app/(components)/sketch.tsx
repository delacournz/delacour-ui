import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { sketchDemos } from "@/demos/sketch";

export default function SketchGallery(): ReactElement {
	return <DemoGallery demos={sketchDemos} title="Sketch" />;
}
