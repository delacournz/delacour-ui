import { type ReactElement, useId } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Mask, Pattern, Rect, Stop } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { COLOR_PICKER_CHECKER_SIZE, COLOR_PICKER_CHECKERBOARD_TOKENS } from "./color-picker.variants";

export type ColorPickerCheckerboardProps = {
	/**
	 * Fade the squares out left to right, between these two fractions of the
	 * width. What the alpha track draws over the current colour — see below.
	 */
	fade?: { start: number; end: number };
};

/**
 * The transparency checkerboard, filling its parent.
 *
 * Drawn in two theme tokens rather than fixed white and grey, so it sits in a
 * dark screen without glaring.
 *
 * **`fade` is how the alpha track avoids an animated gradient.** The track is the
 * current colour as a plain view — an animated `backgroundColor`, which the UI
 * thread can write every frame — with this checkerboard over it, masked from
 * fully opaque at the transparent end to fully clear at the opaque end. A
 * checkerboard at opacity `1 − a` over the colour is the same pixel as the colour
 * at opacity `a` over the checkerboard, so the result is exactly the alpha ramp —
 * with the same RGB the whole way, never a fade through grey — and nothing in the
 * SVG ever has to change. `react-native-svg` collects a gradient's stops in
 * JavaScript at render, so a stop colour animated from the UI thread would never
 * reach the native gradient.
 */
export function ColorPickerCheckerboard({ fade }: ColorPickerCheckerboardProps): ReactElement {
	const [lightToken, darkToken] = COLOR_PICKER_CHECKERBOARD_TOKENS;
	const light = useThemeColor(lightToken);
	const dark = useThemeColor(darkToken);
	// `useId` output carries delimiters that are invalid inside `url(#…)`.
	const id = `color-picker-checker-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
	const edge = COLOR_PICKER_CHECKER_SIZE;

	return (
		<Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
			<Defs>
				<Pattern height={edge * 2} id={`${id}-pattern`} patternUnits="userSpaceOnUse" width={edge * 2}>
					<Rect fill={light} height={edge * 2} width={edge * 2} />
					<Rect fill={dark} height={edge} width={edge} />
					<Rect fill={dark} height={edge} width={edge} x={edge} y={edge} />
				</Pattern>
				{fade ? (
					<LinearGradient id={`${id}-fade`} x1={fade.start} x2={fade.end} y1={0} y2={0}>
						<Stop offset={0} stopColor="#ffffff" stopOpacity={1} />
						<Stop offset={1} stopColor="#ffffff" stopOpacity={0} />
					</LinearGradient>
				) : null}
				{fade ? (
					<Mask id={`${id}-mask`}>
						<Rect fill={`url(#${id}-fade)`} height="100%" width="100%" />
					</Mask>
				) : null}
			</Defs>
			<Rect fill={`url(#${id}-pattern)`} height="100%" mask={fade ? `url(#${id}-mask)` : undefined} width="100%" />
		</Svg>
	);
}
ColorPickerCheckerboard.displayName = "DelacourUI.ColorPicker.Checkerboard";
