import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { bottomSheetHostingDemos } from "@/demos/bottom-sheet/hosting";

export default function BottomSheetHostingDemo(): ReactElement {
	return <DemoGallery demos={bottomSheetHostingDemos} subtitle="Where a teleported sheet lands" title="Hosting" />;
}
