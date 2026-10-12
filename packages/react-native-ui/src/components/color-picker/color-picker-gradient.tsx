import { type ReactElement, useId } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

/**
 * The hue wheel unrolled: red, yellow, green, cyan, blue, magenta, and red again.
 *
 * Literal colours on purpose. These are the colour model's own primaries, not
 * the theme's: a hue track that followed a palette would stop being a hue track.
 */
const HUE_STOPS = ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff", "#ff0000"] as const;

/** An SVG-safe id. `useId` output carries delimiters that are invalid inside `url(#…)`. */
function useGradientId(prefix: string): string {
	return `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

/**
 * The area's two static ramps — white to clear across, clear to black down.
 *
 * Drawn over a plain view whose `backgroundColor` is the current hue at full
 * saturation and brightness; that view is the only thing a hue drag changes,
 * and it changes on the UI thread. The ramps never re-render: white and black
 * here are the HSV model's two poles, not theme colours, which is why they are
 * literals.
 */
export function ColorPickerAreaGradient(): ReactElement {
	const id = useGradientId("color-picker-area");

	return (
		<Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
			<Defs>
				<LinearGradient id={`${id}-s`} x1={0} x2={1} y1={0} y2={0}>
					<Stop offset={0} stopColor="#ffffff" stopOpacity={1} />
					<Stop offset={1} stopColor="#ffffff" stopOpacity={0} />
				</LinearGradient>
				<LinearGradient id={`${id}-v`} x1={0} x2={0} y1={0} y2={1}>
					<Stop offset={0} stopColor="#000000" stopOpacity={0} />
					<Stop offset={1} stopColor="#000000" stopOpacity={1} />
				</LinearGradient>
			</Defs>
			<Rect fill={`url(#${id}-s)`} height="100%" width="100%" />
			<Rect fill={`url(#${id}-v)`} height="100%" width="100%" />
		</Svg>
	);
}
ColorPickerAreaGradient.displayName = "DelacourUI.ColorPicker.Area.Gradient";

export type ColorPickerHueGradientProps = {
	/** Where the wheel starts and ends, as fractions of the width — the thumb's travel, not the track's edge. */
	start: number;
	end: number;
};

/**
 * The hue track's rainbow.
 *
 * Inset to the thumb's travel rather than the track's edge, so the colour under
 * the thumb's centre is the hue it reports at both ends.
 */
export function ColorPickerHueGradient({ start, end }: ColorPickerHueGradientProps): ReactElement {
	const id = useGradientId("color-picker-hue");
	const last = HUE_STOPS.length - 1;

	return (
		<Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
			<Defs>
				<LinearGradient id={id} x1={start} x2={end} y1={0} y2={0}>
					{HUE_STOPS.map((color, index) => (
						<Stop key={color + String(index)} offset={index / last} stopColor={color} />
					))}
				</LinearGradient>
			</Defs>
			<Rect fill={`url(#${id})`} height="100%" width="100%" />
		</Svg>
	);
}
ColorPickerHueGradient.displayName = "DelacourUI.ColorPicker.Hue.Gradient";
