import { memo, type ReactElement } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useReduceTransparency } from "../../hooks/use-reduce-transparency";
import { useThemeColor } from "../../hooks/use-theme-color";
import { withAlpha } from "../../lib/color";
import { useBlurLayer } from "../scroll-blur/scroll-blur.context";
import type { BlurLayerComponent } from "../scroll-blur/scroll-blur.types";
import { useScrollHeaderPart } from "./scroll-header.context";
import {
	resolveBarSurfaceOpacity,
	type ScrollHeaderBarSurface as SurfaceName,
	scrollHeaderVariants,
} from "./scroll-header.variants";

/** The wash over the blur: enough of the page colour to keep the bar's text legible over media. */
const BLUR_WASH_ALPHA = 0.55;

export type ScrollHeaderBarSurfaceProps = {
	surface: SurfaceName;
	divider: boolean;
	intensity: number;
	layer: BlurLayerComponent | undefined;
};

/**
 * The bar's backing and its hairline, fading in together with the collapse.
 *
 * **`blur` falls back to `plain`**, never to nothing: with no engine — no `layer` and no
 * `ScrollBlurLayerProvider` — or with Reduce Transparency on, a transparent bar over scrolled
 * content would leave the bar's text on top of the rows. The engine is ScrollBlur's
 * `BlurLayerComponent` contract, read through its leaf modules, so this folder imports no
 * Expo package.
 *
 * Memoised: only its opacity moves while scrolling, and that is a UI-thread style.
 */
export const ScrollHeaderBarSurface = memo(function ScrollHeaderBarSurface({
	surface,
	divider,
	intensity,
	layer,
}: ScrollHeaderBarSurfaceProps): ReactElement {
	const { source, progress, hasLarge } = useScrollHeaderPart("ScrollHeader.Bar");
	const ambientLayer = useBlurLayer();
	const isReduceTransparency = useReduceTransparency();
	const background = useThemeColor("background");
	const { offset } = source;

	const Layer = surface === "blur" && !isReduceTransparency ? (layer ?? ambientLayer) : null;
	const resolvedSurface: SurfaceName = surface === "blur" && !Layer ? "plain" : surface;
	const slots = scrollHeaderVariants({ surface: resolvedSurface });

	const opacityStyle = useAnimatedStyle(() => ({
		opacity: resolveBarSurfaceOpacity({ hasLarge, progress: progress.value, offset: offset.value }),
	}));

	return (
		<Animated.View
			accessible={false}
			className={slots.barSurface()}
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			style={opacityStyle}
		>
			{Layer ? (
				<>
					<Layer intensity={intensity} material="default" style={{ position: "absolute", inset: 0 }} />
					<View className="absolute inset-0" style={{ backgroundColor: withAlpha(background, BLUR_WASH_ALPHA) }} />
				</>
			) : null}
			{divider ? <View className={slots.divider()} /> : null}
		</Animated.View>
	);
});
ScrollHeaderBarSurface.displayName = "DelacourUI.ScrollHeader.Bar.Surface";
