import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { breadcrumbDemos } from "@/demos/breadcrumb";

export default function BreadcrumbGallery(): ReactElement {
	return <DemoGallery demos={breadcrumbDemos} title="Breadcrumb" />;
}
