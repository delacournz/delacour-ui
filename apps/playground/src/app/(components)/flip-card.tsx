import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { flipCardDemos } from "@/demos/flip-card";

export default function FlipCardGallery(): ReactElement {
	return <DemoGallery demos={flipCardDemos} title="FlipCard" />;
}
