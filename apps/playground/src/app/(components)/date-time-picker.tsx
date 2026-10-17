import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { dateTimePickerDemos } from "@/demos/date-time-picker";

export default function DateTimePickerGallery(): ReactElement {
	return <DemoGallery demos={dateTimePickerDemos} title="Date Time Picker" />;
}
