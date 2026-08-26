import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { bottomSheetFormDemos } from "@/demos/bottom-sheet/form";

export default function BottomSheetFormDemo(): ReactElement {
	return <DemoGallery demos={bottomSheetFormDemos} subtitle="The keyboard path" title="In a form" />;
}
