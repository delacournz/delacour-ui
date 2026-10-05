import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { fabDemos } from "@/demos/fab";

export default function FabGallery(): ReactElement {
	return <DemoGallery demos={fabDemos} title="Fab" />;
}
