import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { textDemos } from "@/demos/text";

export default function TextGallery(): ReactElement {
	return <DemoGallery demos={textDemos} subtitle="Type scale, presets, inline nesting" title="Text" />;
}
