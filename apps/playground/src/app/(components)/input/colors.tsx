import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { inputColorsDemos } from "@/demos/input/colors";

/**
 * The three colours a `TextInput` takes as a value rather than a style.
 *
 * These are the props a className normally cannot reach. Uniwind bridges them
 * by compiling the class and reading its `accentColor`, which is why every value
 * here is an `accent-*` utility — a `text-*` one compiles to a colour uniwind
 * never looks at, so the prop is left undefined and the platform default stands.
 */
export default function InputColorsDemo(): ReactElement {
	return <DemoGallery demos={inputColorsDemos} subtitle="Placeholder, caret, selection" title="Input colours" />;
}
