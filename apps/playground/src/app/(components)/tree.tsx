import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { treeDemos } from "@/demos/tree";

export default function TreeGallery(): ReactElement {
	return <DemoGallery demos={treeDemos} title="Tree" />;
}
