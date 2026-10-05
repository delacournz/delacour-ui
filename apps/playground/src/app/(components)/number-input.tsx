import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { numberInputDemos } from "@/demos/number-input";

export default function NumberInputGallery(): ReactElement {
	return <DemoGallery demos={numberInputDemos} title="NumberInput" />;
}
