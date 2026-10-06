import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { scrollHeaderDemos } from "@/demos/scroll-header";

export default function ScrollHeaderGallery(): ReactElement {
	return (
		<DemoGallery
			demos={scrollHeaderDemos}
			subtitle="A large title that collapses into a pinned bar"
			title="ScrollHeader"
		/>
	);
}
