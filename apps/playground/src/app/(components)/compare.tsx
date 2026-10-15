import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { compareDemos } from "@/demos/compare";

export default function CompareGallery(): ReactElement {
	return <DemoGallery demos={compareDemos} title="Compare" />;
}
