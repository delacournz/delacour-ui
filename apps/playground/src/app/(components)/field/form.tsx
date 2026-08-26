import type { ReactElement } from "react";
import { Demo } from "@/demos/field/form/in-a-form";

/**
 * The whole composition, in the shape an app actually writes.
 *
 * Rendered bare rather than through `DemoGallery`: the demo is itself a
 * `Screen`, and a gallery would nest it inside a second scroll area — which is
 * the one thing this screen exists to exercise.
 */
export default function FieldFormDemo(): ReactElement {
	return <Demo />;
}
