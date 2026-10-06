import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { circularTextDemos } from "@/demos/circular-text";

export default function CircularTextGallery(): ReactElement {
	return <DemoGallery demos={circularTextDemos} subtitle="Text on a circle, optionally turning" title="CircularText" />;
}
