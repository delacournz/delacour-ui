import type { ReactElement } from "react";
import { Demo } from "@/demos/input/form/in-a-form";

/**
 * `Input` in the composition it exists for: a real form under a sticky footer.
 *
 * Rendered bare rather than through `DemoGallery`: the demo is itself a
 * `Screen`, and a gallery would nest it inside a second scroll area — which is
 * the one thing this screen exists to exercise.
 */
export default function InputFormDemo(): ReactElement {
	return <Demo />;
}
