import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { selectionModeDemos } from "@/demos/selection-mode";

export default function SelectionModeGallery(): ReactElement {
	return <DemoGallery demos={selectionModeDemos} title="SelectionMode" />;
}
