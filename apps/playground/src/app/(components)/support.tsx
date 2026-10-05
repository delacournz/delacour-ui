import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { supportDemos } from "@/demos/support";

export default function SupportGallery(): ReactElement {
	return <DemoGallery demos={supportDemos} title="Support" />;
}
