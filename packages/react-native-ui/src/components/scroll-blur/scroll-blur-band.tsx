import { LinearGradient } from "expo-linear-gradient";
import { memo, type ReactElement } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import type { ScrollSource } from "../../hooks/use-scroll-source";
import { resolveFadeBand, resolveFadeGradient } from "../../lib/scroll-edges";
import { type ScrollEdge, scrollEdgeOpacity } from "../../lib/scroll-maths";
import type { BlurLayerComponent, BlurMaterial } from "./scroll-blur.types";
import type { BlurStackView } from "./scroll-blur.variants";

export type ScrollBlurBandProps = {
	edge: ScrollEdge;
	source: ScrollSource;
	size: number;
	inset: number;
	fadeInDistance: number;
	/** The nested blur views, widest first. */
	stack: BlurStackView[];
	/** The engine to draw strips with; null draws the wash alone. */
	layer: BlurLayerComponent | null;
	material: BlurMaterial;
	/** The wash's solid end, at the edge; undefined draws no wash. */
	nearColor: string | undefined;
	/** The wash's clear end, inward — the near colour at zero alpha. */
	farColor: string | undefined;
	className: string;
};

/**
 * One edge of a `ScrollBlur`: its strips, the wash over them, and the one
 * opacity that follows the scroll.
 *
 * **Only the band's opacity animates.** The strips are laid out once per
 * render and their intensities never change while scrolling — animating a
 * native blur's radius per frame is expensive on iOS and unreliable on Android
 * — so a scroll moves one style on the UI thread and re-renders nothing.
 *
 * **The blur views are nested at the edge, not laid side by side** — see
 * `resolveBlurStack`. Each is placed with the band geometry, not a second copy
 * of it: a view pinned at the edge and `size` deep is a band at inset 0.
 *
 * The wash is painted last, over the blur, so what remains of each small step
 * between views is ramped away into the surface colour.
 */
export const ScrollBlurBand = memo(function ScrollBlurBand({
	edge,
	source,
	size,
	inset,
	fadeInDistance,
	stack,
	layer: Layer,
	material,
	nearColor,
	farColor,
	className,
}: ScrollBlurBandProps): ReactElement {
	const { offset, contentSize, layoutSize, orientation } = source;
	const placement = resolveFadeBand({ orientation, edge, size, inset });
	const gradient = resolveFadeGradient({ orientation, edge });
	const crossAxis = orientation === "vertical" ? { left: 0, right: 0 } : { top: 0, bottom: 0 };

	const opacityStyle = useAnimatedStyle(() => ({
		opacity: scrollEdgeOpacity({
			edge,
			offset: offset.value,
			contentSize: contentSize.value,
			layoutSize: layoutSize.value,
			fadeInDistance,
		}),
	}));

	// Blur first, wash last: paint order is source order, and the wash has to
	// sit over the steps between blur views to ramp them away.
	return (
		<Animated.View
			accessible={false}
			className={className}
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			style={[placement, opacityStyle]}
		>
			{Layer
				? stack.map((view) => (
						<Layer
							intensity={view.intensity}
							key={view.size}
							material={material}
							style={[
								{ position: "absolute" },
								crossAxis,
								resolveFadeBand({ orientation, edge, size: view.size, inset: 0 }),
							]}
						/>
					))
				: null}
			{nearColor && farColor ? (
				<LinearGradient
					colors={[nearColor, farColor]}
					end={gradient.end}
					start={gradient.start}
					style={StyleSheet.absoluteFill}
				/>
			) : null}
		</Animated.View>
	);
});
ScrollBlurBand.displayName = "DelacourUI.ScrollBlur.Band";
