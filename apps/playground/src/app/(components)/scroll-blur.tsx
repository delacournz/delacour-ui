import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { scrollBlurDemos } from "@/demos/scroll-blur";

export default function ScrollBlurGallery(): ReactElement {
	return (
		<DemoGallery demos={scrollBlurDemos} subtitle="A progressive blur at a scrollable's edges" title="ScrollBlur" />
	);
}
