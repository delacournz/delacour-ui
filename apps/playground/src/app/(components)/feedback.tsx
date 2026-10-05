import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { feedbackDemos } from "@/demos/feedback";

export default function FeedbackGallery(): ReactElement {
	return <DemoGallery demos={feedbackDemos} title="Feedback" />;
}
