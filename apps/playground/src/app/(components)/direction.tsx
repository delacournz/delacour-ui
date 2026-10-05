import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { directionDemos } from "@/demos/direction";

export default function DirectionGallery(): ReactElement {
	return <DemoGallery demos={directionDemos} title="Direction" />;
}
