import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { menuDemos } from "@/demos/menu";

export default function MenuGallery(): ReactElement {
	return <DemoGallery demos={menuDemos} title="Menu" />;
}
