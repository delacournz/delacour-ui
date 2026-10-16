import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { mapDemos } from "@/demos/map";

export default function MapGallery(): ReactElement {
	return <DemoGallery demos={mapDemos} title="Map" />;
}
