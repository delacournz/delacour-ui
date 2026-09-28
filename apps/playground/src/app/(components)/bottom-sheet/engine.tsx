import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { bottomSheetEngineDemos } from "@/demos/bottom-sheet-engine";

/** The engine on its own — `@delacour/react-native-bottom-sheet` with nothing themed in front of it. */
export default function BottomSheetEngineGallery(): ReactElement {
	return <DemoGallery demos={bottomSheetEngineDemos} subtitle="Engine" title="Bottom sheet" />;
}
