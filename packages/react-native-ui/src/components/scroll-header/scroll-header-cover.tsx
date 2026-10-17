import { LinearGradient } from "expo-linear-gradient";
import type { ReactElement } from "react";
import { Image, type ImageSourcePropType, StyleSheet, View, type ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useScrollHeaderPart } from "./scroll-header.context";
import { resolveCoverStretch, scrollHeaderVariants } from "./scroll-header.variants";

/** What the cover paints: an image, or a gradient of at least two colours. Never both. */
export type ScrollHeaderCoverFill =
	| { source: ImageSourcePropType; colors?: never }
	| { colors: readonly [string, string, ...string[]]; source?: never };

export type ScrollHeaderCoverProps = ViewProps &
	ScrollHeaderCoverFill & {
		/** Darkening wash for text legibility. @default true */
		scrim?: boolean;
		className?: string;
	};

/**
 * Below the scroller and therefore below every row; set inline because a negative z-index
 * utility is not one this package relies on Uniwind to compile.
 */
const COVER_LAYER = { zIndex: -1 } as const;

/**
 * A full-bleed image or gradient behind the bar and the Large block, scrolling away with the
 * content and stretching when the page is pulled down past the top.
 *
 * Its resting height is the header's inset — safe-area band, bar and Large block — so it ends
 * exactly where the first row begins. `stretch` (on by default, off under Reduce Motion) grows
 * it from a fixed top edge on a pull; without it, the cover rides down with the content.
 *
 * Decorative: it takes no touches and is hidden from assistive technology. Pair it with
 * `surface="none"` on the bar, so the cover shows through until the header collapses.
 */
export function ScrollHeaderCover({
	source,
	colors,
	scrim = true,
	className,
	style,
	...props
}: ScrollHeaderCoverProps): ReactElement {
	const { source: scrollSource, topInset, isStretchEnabled } = useScrollHeaderPart("ScrollHeader.Cover");
	const { offset } = scrollSource;
	const slots = scrollHeaderVariants();

	const animatedStyle = useAnimatedStyle(() => {
		const { height, translateY } = resolveCoverStretch({
			offset: offset.value,
			baseHeight: topInset.value,
			stretch: isStretchEnabled,
		});
		return { height, transform: [{ translateY }] };
	});

	return (
		<Animated.View
			accessible={false}
			className={slots.cover({ className })}
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			style={[COVER_LAYER, style, animatedStyle]}
			{...props}
		>
			{source ? <Image resizeMode="cover" source={source} style={StyleSheet.absoluteFill} /> : null}
			{colors ? <LinearGradient colors={colors} style={StyleSheet.absoluteFill} /> : null}
			{scrim ? <View className={slots.scrim()} /> : null}
		</Animated.View>
	);
}
ScrollHeaderCover.displayName = "DelacourUI.ScrollHeader.Cover";
