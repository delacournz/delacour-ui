import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { sortableDemos } from "@/demos/sortable";

export default function SortableGallery(): ReactElement {
	return <DemoGallery demos={sortableDemos} title="Sortable" />;
}
