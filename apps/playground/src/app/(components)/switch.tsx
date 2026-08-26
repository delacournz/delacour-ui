import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { switchDemos } from "@/demos/switch";

export default function SwitchGallery(): ReactElement {
	return <DemoGallery demos={switchDemos} title="Switch" />;
}
