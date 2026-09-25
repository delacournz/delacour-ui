import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { alertDemos } from "@/demos/alert";

export default function AlertGallery(): ReactElement {
	return <DemoGallery demos={alertDemos} title="Alert" />;
}
