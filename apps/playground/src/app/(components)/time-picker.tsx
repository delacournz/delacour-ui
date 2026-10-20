import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { timePickerDemos } from "@/demos/time-picker";

export default function TimePickerGallery(): ReactElement {
	return <DemoGallery demos={timePickerDemos} title="TimePicker" />;
}
