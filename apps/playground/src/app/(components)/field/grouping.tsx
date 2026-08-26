import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { fieldGroupingDemos } from "@/demos/field/grouping";

/**
 * The three levels above a single field, and the rule between them.
 *
 * The separator section is the one to check on a surface: this implementation
 * draws two rules with the label between them rather than one rule with an
 * opaque label parked on top of it, so it does not need to know what colour it
 * is sitting on. The card below is the case that catches the other approach.
 */
export default function FieldGroupingDemo(): ReactElement {
	return <DemoGallery demos={fieldGroupingDemos} subtitle="Set, group and separator" title="Field grouping" />;
}
