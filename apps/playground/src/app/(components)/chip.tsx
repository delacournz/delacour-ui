import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { chipDemos } from "@/demos/chip";

export default function ChipGallery(): ReactElement {
	return <DemoGallery demos={chipDemos} title="Chip" />;
}
