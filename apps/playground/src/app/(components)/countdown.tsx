import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { countdownDemos } from "@/demos/countdown";

export default function CountdownGallery(): ReactElement {
	return <DemoGallery demos={countdownDemos} title="Countdown" />;
}
