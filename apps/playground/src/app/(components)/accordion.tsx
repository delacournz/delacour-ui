import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { accordionDemos } from "@/demos/accordion";

export default function AccordionGallery(): ReactElement {
	return <DemoGallery demos={accordionDemos} title="Accordion" />;
}
