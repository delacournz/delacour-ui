import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { pageHeaderDemos } from "@/demos/page-header";

export default function PageHeaderGallery(): ReactElement {
	return <DemoGallery demos={pageHeaderDemos} title="PageHeader" />;
}
