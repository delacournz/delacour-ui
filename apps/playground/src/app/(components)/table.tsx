import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { tableDemos } from "@/demos/table";

export default function TableGallery(): ReactElement {
	return <DemoGallery demos={tableDemos} title="Table" />;
}
