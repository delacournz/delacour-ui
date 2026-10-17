import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { messageScrollerDemos } from "@/demos/message-scroller";

export default function MessageScrollerGallery(): ReactElement {
	return <DemoGallery demos={messageScrollerDemos} title="Message Scroller" />;
}
