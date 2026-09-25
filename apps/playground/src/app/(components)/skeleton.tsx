import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { skeletonDemos } from "@/demos/skeleton";

export default function SkeletonGallery(): ReactElement {
	return <DemoGallery demos={skeletonDemos} subtitle="Shapes, shimmer, groups" title="Skeleton" />;
}
