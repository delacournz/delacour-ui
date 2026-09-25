import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { cardDemos } from "@/demos/card";

export default function CardGallery(): ReactElement {
	return <DemoGallery demos={cardDemos} title="Card" />;
}
