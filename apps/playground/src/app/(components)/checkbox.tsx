import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { checkboxDemos } from "@/demos/checkbox";

export default function CheckboxGallery(): ReactElement {
	return <DemoGallery demos={checkboxDemos} title="Checkbox" />;
}
