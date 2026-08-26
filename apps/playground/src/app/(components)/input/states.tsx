import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { inputStatesDemos } from "@/demos/input/states";

/**
 * The states a field reports, and the React Native props it passes straight
 * through.
 *
 * `InputProps` extends `TextInputProps`, so everything below the first section
 * is inherited rather than restated — the component adds four props and removes
 * one, and the rest of the platform's surface is untouched.
 */
export default function InputStatesDemo(): ReactElement {
	return <DemoGallery demos={inputStatesDemos} subtitle="Reported and inherited" title="Input states" />;
}
