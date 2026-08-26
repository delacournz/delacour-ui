import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { inputGroupDemos } from "@/demos/input/group";

/**
 * `Input.Group` — prefix and suffix content inside the field's own box.
 *
 * The first section is the acceptance test for the whole component: a lone
 * field directly above a grouped one. They read the same `root` slot of
 * `inputVariants`, which lands on the `TextInput` when a field stands alone and
 * on the group's row when it does not, so the two boxes are the same box rather
 * than two class strings that happen to agree.
 */
export default function InputGroupDemo(): ReactElement {
	return <DemoGallery demos={inputGroupDemos} subtitle="Prefix and suffix" title="Input.Group" />;
}
