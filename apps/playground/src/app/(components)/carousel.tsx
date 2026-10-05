import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { carouselDemos } from "@/demos/carousel";

export default function CarouselGallery(): ReactElement {
	return <DemoGallery demos={carouselDemos} title="Carousel" />;
}
