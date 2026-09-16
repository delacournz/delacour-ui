import { INPUT_SIZES } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { inputSizesDemos } from "@/demos/input/sizes";

/**
 * The input scale, and the two things it drives beyond the box.
 *
 * The row pairing a field with a button is the reason `--spacing-input-*` names
 * the same numbers as `--spacing-button-*` rather than borrowing them: they are
 * separate scales that a token test asserts stay level, so either can be retuned
 * without silently dragging the other with it.
 */
export default function InputSizesDemo(): ReactElement {
	return <DemoGallery demos={inputSizesDemos} subtitle={`${INPUT_SIZES.length} steps`} title="Input sizes" />;
}
