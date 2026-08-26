import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { iconDemos } from "@/demos/icon";

export default function IconGallery(): ReactElement {
	return <DemoGallery demos={iconDemos} title="Icon" />;
}
