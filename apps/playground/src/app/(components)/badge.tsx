import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { badgeDemos } from "@/demos/badge";

export default function BadgeGallery(): ReactElement {
	return <DemoGallery demos={badgeDemos} title="Badge" />;
}
