import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { radioDemos } from "@/demos/radio";

export default function RadioGallery(): ReactElement {
	return <DemoGallery demos={radioDemos} title="Radio" />;
}
