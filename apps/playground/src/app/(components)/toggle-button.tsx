import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { toggleButtonDemos } from "@/demos/toggle-button";

export default function ToggleButtonGallery(): ReactElement {
	return <DemoGallery demos={toggleButtonDemos} title="ToggleButton" />;
}
