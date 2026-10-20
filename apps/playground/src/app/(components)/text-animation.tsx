import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { textAnimationDemos } from "@/demos/text-animation";

export default function TextAnimationGallery(): ReactElement {
	return <DemoGallery demos={textAnimationDemos} title="TextAnimation" />;
}
