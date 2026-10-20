import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { tourDemos } from "@/demos/tour";

export default function TourGallery(): ReactElement {
	return <DemoGallery demos={tourDemos} title="Tour" />;
}
