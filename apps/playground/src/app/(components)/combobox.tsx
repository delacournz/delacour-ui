import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { comboboxDemos } from "@/demos/combobox";

export default function ComboboxGallery(): ReactElement {
	return <DemoGallery demos={comboboxDemos} title="Combobox" />;
}
