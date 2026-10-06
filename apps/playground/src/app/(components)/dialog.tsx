import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { dialogDemos } from "@/demos/dialog";

export default function DialogGallery(): ReactElement {
	return <DemoGallery demos={dialogDemos} title="Dialog" />;
}
