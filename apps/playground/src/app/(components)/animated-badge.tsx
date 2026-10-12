import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { animatedBadgeDemos } from "@/demos/animated-badge";

export default function AnimatedBadgeGallery(): ReactElement {
	return <DemoGallery demos={animatedBadgeDemos} title="AnimatedBadge" />;
}
