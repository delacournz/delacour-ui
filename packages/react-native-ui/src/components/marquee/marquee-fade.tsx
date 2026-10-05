import { type ReactElement, useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import type { MarqueeAxis, MarqueeFadeColor } from "./marquee.variants";

export type MarqueeFadeProps = {
	axis: MarqueeAxis;
	/** How far each fade reaches in from its edge, in points. */
	size: number;
	/** The surface the marquee sits on — the fade blends the content into it. */
	color: MarqueeFadeColor;
	className: string;
};

/**
 * The two edge gradients that let content dissolve into the surface instead of
 * being cut off by the clip.
 *
 * Each is a unit viewBox stretched over an absolutely filled `Svg`, for the
 * reason `Skeleton`'s shimmer gives: a percentage-sized `Svg` can keep its first
 * size when its box resizes. The colour is a token value, so it has to equal
 * the surface underneath — a fade into `background` on a card reads as a smear.
 * They take no touches, so a child under a fade still presses.
 */
export function MarqueeFade({ axis, size, color, className }: MarqueeFadeProps): ReactElement {
	const stopColor = useThemeColor(color);
	const id = `marquee-fade-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
	const isHorizontal = axis === "horizontal";

	const start = isHorizontal ? { left: 0, width: size } : { height: size, top: 0 };
	const end = isHorizontal ? { right: 0, width: size } : { bottom: 0, height: size };
	const vector = isHorizontal ? { x1: "0", x2: "1", y1: "0", y2: "0" } : { x1: "0", x2: "0", y1: "0", y2: "1" };

	return (
		<>
			<View className={className} pointerEvents="none" style={start}>
				<Svg preserveAspectRatio="none" style={StyleSheet.absoluteFill} viewBox="0 0 1 1">
					<Defs>
						<LinearGradient id={`${id}-start`} {...vector}>
							<Stop offset={0} stopColor={stopColor} stopOpacity={1} />
							<Stop offset={1} stopColor={stopColor} stopOpacity={0} />
						</LinearGradient>
					</Defs>
					<Rect fill={`url(#${id}-start)`} height={1} width={1} x={0} y={0} />
				</Svg>
			</View>
			<View className={className} pointerEvents="none" style={end}>
				<Svg preserveAspectRatio="none" style={StyleSheet.absoluteFill} viewBox="0 0 1 1">
					<Defs>
						<LinearGradient id={`${id}-end`} {...vector}>
							<Stop offset={0} stopColor={stopColor} stopOpacity={0} />
							<Stop offset={1} stopColor={stopColor} stopOpacity={1} />
						</LinearGradient>
					</Defs>
					<Rect fill={`url(#${id}-end)`} height={1} width={1} x={0} y={0} />
				</Svg>
			</View>
		</>
	);
}
MarqueeFade.displayName = "DelacourUI.Marquee.Fade";
