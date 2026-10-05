import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { drawerDemos } from "@/demos/drawer";

export default function DrawerGallery(): ReactElement {
	return <DemoGallery demos={drawerDemos} title="Drawer" />;
}
