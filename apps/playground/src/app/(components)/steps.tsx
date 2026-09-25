import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { stepsDemos } from "@/demos/steps";

export default function StepsGallery(): ReactElement {
	return <DemoGallery demos={stepsDemos} title="Steps" />;
}
