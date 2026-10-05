import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { popoverDemos } from "@/demos/popover";

export default function PopoverGallery(): ReactElement {
	return <DemoGallery demos={popoverDemos} title="Popover" />;
}
