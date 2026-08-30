import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { inputVariantsDemos } from "@/demos/input/variants";

/**
 * The two variants across every state the box can be in.
 *
 * Focus is the one state that cannot be rendered on demand — tap a field to see
 * the border move to the ring token, and tap an invalid one to confirm it stays
 * destructive rather than going grey the moment it is being corrected.
 */
export default function InputVariantsDemo(): ReactElement {
	return <DemoGallery demos={inputVariantsDemos} subtitle="primary and secondary" title="Input variants" />;
}
