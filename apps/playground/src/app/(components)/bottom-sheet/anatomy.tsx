import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { bottomSheetAnatomyDemos } from "@/demos/bottom-sheet/anatomy";

export default function BottomSheetAnatomyDemo(): ReactElement {
	return <DemoGallery demos={bottomSheetAnatomyDemos} title="Anatomy" />;
}
