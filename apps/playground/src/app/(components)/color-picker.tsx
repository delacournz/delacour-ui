import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { colorPickerDemos } from "@/demos/color-picker";

export default function ColorPickerGallery(): ReactElement {
	return <DemoGallery demos={colorPickerDemos} title="ColorPicker" />;
}
