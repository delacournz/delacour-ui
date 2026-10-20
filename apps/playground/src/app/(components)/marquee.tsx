import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { marqueeDemos } from "@/demos/marquee";

export default function MarqueeGallery(): ReactElement {
	return <DemoGallery demos={marqueeDemos} title="Marquee" />;
}
