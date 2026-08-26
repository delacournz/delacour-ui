import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { fieldStatesDemos } from "@/demos/field/states";

/**
 * The state cascade — the reason `Field` has a context at all.
 *
 * On the web shadcn reddens a field's control with
 * `group-data-[invalid=true]/field:`, a parent-scoped selector. Uniwind matches
 * data selectors against the props of the component carrying the class, so no
 * class on a `Field` can reach the `Input` inside it. A context can, and this
 * screen is the check that it does.
 */
export default function FieldStatesDemo(): ReactElement {
	return <DemoGallery demos={fieldStatesDemos} subtitle="The cascade" title="Field states" />;
}
