import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { stackCardDemos } from "@/demos/stack-card";

export default function StackCardGallery(): ReactElement {
	return <DemoGallery demos={stackCardDemos} title="StackCard" />;
}
