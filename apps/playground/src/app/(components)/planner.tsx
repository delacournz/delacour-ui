import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { plannerDemos } from "@/demos/planner";

export default function PlannerGallery(): ReactElement {
	return <DemoGallery demos={plannerDemos} title="Planner" />;
}
