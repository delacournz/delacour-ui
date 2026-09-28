import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { bottomSheetStepsDemos } from "@/demos/bottom-sheet/steps";

export default function BottomSheetStepsDemo(): ReactElement {
	return <DemoGallery demos={bottomSheetStepsDemos} subtitle="A body that follows a machine" title="Steps" />;
}
