import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { calendarDemos } from "@/demos/calendar";

export default function CalendarGallery(): ReactElement {
	return <DemoGallery demos={calendarDemos} title="Calendar" />;
}
