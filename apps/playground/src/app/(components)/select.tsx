import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { selectDemos } from "@/demos/select";

export default function SelectGallery(): ReactElement {
	return <DemoGallery demos={selectDemos} title="Select" />;
}
