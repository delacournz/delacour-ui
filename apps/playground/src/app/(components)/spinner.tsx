import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { spinnerDemos } from "@/demos/spinner";

export default function SpinnerGallery(): ReactElement {
	return <DemoGallery demos={spinnerDemos} subtitle="Named sizes are shared with Icon" title="Spinner" />;
}
