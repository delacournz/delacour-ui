import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { labelDemos } from "@/demos/label";

export default function LabelGallery(): ReactElement {
	return <DemoGallery demos={labelDemos} subtitle="Required, invalid and disabled states" title="Label" />;
}
