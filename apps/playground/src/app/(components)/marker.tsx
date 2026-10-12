import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { markerDemos } from "@/demos/marker";

export default function MarkerGallery(): ReactElement {
	return <DemoGallery demos={markerDemos} title="Marker" />;
}
