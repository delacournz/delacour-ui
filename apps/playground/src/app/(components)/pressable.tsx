import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { pressableDemos } from "@/demos/pressable";

export default function PressableGallery(): ReactElement {
	return <DemoGallery demos={pressableDemos} title="Pressable" />;
}
