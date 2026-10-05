import { type ReactElement, useMemo } from "react";
import { View } from "react-native";
import { useReduceTransparency } from "../../hooks/use-reduce-transparency";
import { useResolvedScrollSource } from "../../hooks/use-scroll-source";
import { useThemeColor } from "../../hooks/use-theme-color";
import { cn } from "../../lib/cn";
import { transparentOf, withAlpha } from "../../lib/color";
import { resolveFadeEdges } from "../../lib/scroll-edges";
import { useBlurLayer } from "./scroll-blur.context";
import type { ScrollBlurProps } from "./scroll-blur.types";
import { resolveBlurLayers, resolveBlurWash, scrollBlurVariants } from "./scroll-blur.variants";
import { ScrollBlurBand } from "./scroll-blur-band";

/**
 * A progressive blur at a scrollable's start and end edges, so a control
 * floating over a list stays legible over any background — a photo, a tinted
 * card, a gradient — where a gradient fade into one flat colour would leave a
 * grey band.
 *
 * **It wraps the scrollable but never touches it.** The scroll arrives through
 * a `ScrollSource` — the `scrollSource` prop, else the nearest
 * `ScrollSourceProvider` or `Screen` — so nothing clones the child to attach an
 * `onScroll`. The bands paint after `children`, so a floating control belongs
 * beside the `ScrollBlur`, never inside it, or it sits under its own blur.
 *
 * **The blur engine is injected.** Nothing here imports `expo-blur`: the app
 * mounts `ScrollBlurLayerProvider` with `ExpoBlurLayer` once, or passes `layer`
 * per call. With neither, or with Reduce Transparency on, the band draws its
 * wash alone at a solid edge — a gradient fade, which still hides content fully
 * at the edge and costs no native view.
 *
 * **Each edge is in only while there is content past it**, by
 * `scrollEdgeOpacity`: the start arrives over `fadeInDistance` points of
 * travel, the end leaves over the last ones, and content too short to scroll
 * draws neither.
 *
 * @example
 * const { source, scrollProps } = useScrollSource();
 *
 * <View className="flex-1">
 *   <ScrollBlur className="flex-1" edges="end" scrollSource={source}>
 *     <Animated.FlatList data={rows} renderItem={renderRow} {...scrollProps} />
 *   </ScrollBlur>
 *   <View className="absolute inset-x-0 bottom-0 p-4">
 *     <Button>Continue</Button>
 *   </View>
 * </View>
 */
export function ScrollBlur({
	children,
	size = 80,
	edges = "both",
	layers = 8,
	intensity = 56,
	material = "default",
	color,
	tint = 0.9,
	fadeInDistance = 24,
	insetStart = 0,
	insetEnd = 0,
	layer,
	scrollSource,
	enabled = true,
	className,
	...props
}: ScrollBlurProps): ReactElement {
	const source = useResolvedScrollSource("ScrollBlur", scrollSource);
	const ambientLayer = useBlurLayer();
	const isReduceTransparency = useReduceTransparency();
	const background = useThemeColor("background");

	const Layer = isReduceTransparency ? null : (layer ?? ambientLayer);
	const paint = color ?? background;
	const { edgeAlpha } = resolveBlurWash({ tint: Layer ? tint : 1 });
	const nearColor = withAlpha(paint, edgeAlpha);
	const farColor = transparentOf(paint);

	const strips = useMemo(() => resolveBlurLayers({ size, layers, intensity }), [size, layers, intensity]);
	const show = resolveFadeEdges(enabled ? edges : "none");
	const slots = scrollBlurVariants({ orientation: source.orientation });
	const band = slots.band();

	const shared = {
		source,
		size,
		fadeInDistance,
		strips,
		layer: Layer,
		material,
		nearColor,
		farColor,
		className: band,
	};

	return (
		<View className={slots.root({ className: cn(className) })} {...props}>
			{children}
			{show.start ? <ScrollBlurBand edge="start" inset={insetStart} {...shared} /> : null}
			{show.end ? <ScrollBlurBand edge="end" inset={insetEnd} {...shared} /> : null}
		</View>
	);
}
ScrollBlur.displayName = "DelacourUI.ScrollBlur";
