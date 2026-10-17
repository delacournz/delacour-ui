import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { scrollFadeDemos } from "@/demos/scroll-fade";

export default function ScrollFadeGallery(): ReactElement {
	return <DemoGallery demos={scrollFadeDemos} subtitle="Edges, axes, surfaces" title="ScrollFade" />;
}
