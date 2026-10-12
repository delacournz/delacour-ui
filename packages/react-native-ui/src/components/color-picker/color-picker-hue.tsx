import type { ReactElement } from "react";
import { ColorPickerTrack, type ColorPickerTrackProps } from "./color-picker-track";

export type ColorPickerHueProps = ColorPickerTrackProps;

/**
 * The hue track — the full rainbow, red to red.
 *
 * Dragging it moves only the hue, so saturation and brightness hold wherever
 * the area left them. A screen reader hears "Hue 210 degrees, blue" and steps
 * ten degrees a swipe, wrapping at either end.
 */
export function ColorPickerHue(props: ColorPickerHueProps): ReactElement {
	return <ColorPickerTrack channel="hue" {...props} />;
}
ColorPickerHue.displayName = "DelacourUI.ColorPicker.Hue";
