import type { ReactElement } from "react";
import { useColorPickerPart } from "./color-picker.context";
import { ColorPickerTrack, type ColorPickerTrackProps } from "./color-picker-track";

export type ColorPickerAlphaProps = ColorPickerTrackProps;

/**
 * The opacity track — the current colour fading to a checkerboard.
 *
 * **Renders nothing unless the picker has `hasAlpha`.** Without it the alpha is
 * pinned at one, so a track that could not move it would be a control that
 * lies. That is what lets one anatomy serve both kinds of picker.
 *
 * The fade keeps the same RGB from end to end — it is never a gradient towards
 * the keyword `transparent`, which is transparent black and blooms grey across
 * the middle.
 */
export function ColorPickerAlpha(props: ColorPickerAlphaProps): ReactElement | null {
	const { hasAlpha } = useColorPickerPart("ColorPicker.Alpha");
	if (!hasAlpha) return null;
	return <ColorPickerTrack channel="alpha" {...props} />;
}
ColorPickerAlpha.displayName = "DelacourUI.ColorPicker.Alpha";
