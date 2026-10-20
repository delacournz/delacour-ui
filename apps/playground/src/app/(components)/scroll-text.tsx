import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { scrollTextDemos } from "@/demos/scroll-text";

export default function ScrollTextGallery(): ReactElement {
	return (
		<DemoGallery demos={scrollTextDemos} subtitle="Colour, rise, highlight, by character and line" title="ScrollText" />
	);
}
