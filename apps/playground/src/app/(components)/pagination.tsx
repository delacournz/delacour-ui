import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { paginationDemos } from "@/demos/pagination";

export default function PaginationGallery(): ReactElement {
	return <DemoGallery demos={paginationDemos} title="Pagination" />;
}
