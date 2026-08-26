import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { sliderDemos } from "@/demos/slider";

export default function SliderGallery(): ReactElement {
	return <DemoGallery demos={sliderDemos} title="Slider" />;
}
