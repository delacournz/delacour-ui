import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { fieldAnatomyDemos } from "@/demos/field/anatomy";

/**
 * The parts of a field, and the spacing ladder that holds them apart.
 *
 * The last section is the one worth staring at: a label attaches to the control
 * below it rather than the one above only because the gap inside a field is
 * tighter than the gap between two. Nothing else is doing that work.
 */
export default function FieldAnatomyDemo(): ReactElement {
	return <DemoGallery demos={fieldAnatomyDemos} subtitle="The parts and the rhythm" title="Field anatomy" />;
}
