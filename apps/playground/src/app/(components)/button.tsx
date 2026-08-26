import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { buttonDemos } from "@/demos/button";

export default function ButtonGallery(): ReactElement {
	return <DemoGallery demos={buttonDemos} title="Button" />;
}
