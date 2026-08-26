import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { bottomSheetScrollingDemos } from "@/demos/bottom-sheet/scrolling";

export default function BottomSheetScrollingDemo(): ReactElement {
	return <DemoGallery demos={bottomSheetScrollingDemos} subtitle="And the pan it negotiates with" title="Scrolling" />;
}
