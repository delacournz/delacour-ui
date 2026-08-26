import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { bottomSheetSizingDemos } from "@/demos/bottom-sheet/sizing";

export default function BottomSheetSizingDemo(): ReactElement {
	return <DemoGallery demos={bottomSheetSizingDemos} subtitle="Dynamic, snapped and capped" title="Sizing" />;
}
