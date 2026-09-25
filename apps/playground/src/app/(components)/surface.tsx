import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { surfaceDemos } from "@/demos/surface";

export default function SurfaceGallery(): ReactElement {
	return <DemoGallery demos={surfaceDemos} title="Surface" />;
}
