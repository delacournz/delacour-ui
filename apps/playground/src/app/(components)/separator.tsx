import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { separatorDemos } from "@/demos/separator";

export default function SeparatorGallery(): ReactElement {
	return (
		<DemoGallery demos={separatorDemos} subtitle="A one-pixel rule, hidden from assistive tech" title="Separator" />
	);
}
