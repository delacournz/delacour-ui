import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { toastDemos } from "@/demos/toast";

export default function ToastGallery(): ReactElement {
	return <DemoGallery demos={toastDemos} title="Toast" />;
}
