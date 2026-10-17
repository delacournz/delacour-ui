import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { messageDemos } from "@/demos/message";

export default function MessageGallery(): ReactElement {
	return <DemoGallery demos={messageDemos} title="Message" />;
}
