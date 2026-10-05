import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { datePickerDemos } from "@/demos/date-picker";

export default function DatePickerGallery(): ReactElement {
	return <DemoGallery demos={datePickerDemos} title="Date Picker" />;
}
