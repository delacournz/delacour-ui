import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { bottomSheetFooterDemos } from "@/demos/bottom-sheet/footer";

export default function BottomSheetFooterDemo(): ReactElement {
	return <DemoGallery demos={bottomSheetFooterDemos} subtitle="Inline by default, sticky on request" title="Footer" />;
}
