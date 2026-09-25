import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { ratingDemos } from "@/demos/rating";

export default function RatingGallery(): ReactElement {
	return <DemoGallery demos={ratingDemos} title="Rating" />;
}
