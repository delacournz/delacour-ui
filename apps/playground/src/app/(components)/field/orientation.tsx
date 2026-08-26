import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { fieldOrientationDemos } from "@/demos/field/orientation";

/**
 * The two orientations.
 *
 * There is no `responsive` third. shadcn's switches on a CSS container query,
 * which React Native does not have.
 *
 * The horizontal rows hold a real `Checkbox`, which makes the invalid section
 * below the live proof of the state cascade rather than a mock-up of it: nothing
 * on those boxes says `isInvalid`, and they redden from the `Field` alone.
 */
export default function FieldOrientationDemo(): ReactElement {
	return <DemoGallery demos={fieldOrientationDemos} subtitle="Vertical and horizontal" title="Field orientation" />;
}
