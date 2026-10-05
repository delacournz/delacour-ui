import { LinearGradient } from "expo-linear-gradient";
import { type ReactElement, type ReactNode, useCallback } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useThemeColor } from "../../hooks/use-theme-color";
import { transparentOf } from "../../lib/color";
import { useSurfaceContext } from "../surface/surface.context";
import {
	resolveTableEdgeFade,
	resolveTableFadeToken,
	type TableSize,
	type TableVariant,
	tableVariants,
} from "./table.variants";

export type TableScrollProps = {
	/** The width the table lays out at. */
	contentWidth: number;
	/** Whether the content is wider than the viewport; a table that fits neither scrolls nor fades. */
	isScrollable: boolean;
	size: TableSize;
	variant: TableVariant;
	children: ReactNode;
};

/**
 * The horizontal scroller a table with a `minWidth` wider than its container
 * sits in, with a fade at each edge that has more columns past it.
 *
 * The fades are opacity only, driven from the scroll offset on the UI thread by
 * {@link resolveTableEdgeFade}: the start fade arrives as the first column
 * leaves and the end fade goes as the last one arrives, so neither edge
 * promises columns that are not there.
 *
 * **The far stop is the near colour at zero alpha, never `transparent`** — the
 * keyword is transparent black and drags the gradient through grey. With no
 * colour to fade from it draws no fade at all. See `Screen.ScrollShadow`.
 *
 * Internal: `Table` renders it, nothing else does.
 */
export function TableScroll({ contentWidth, isScrollable, size, variant, children }: TableScrollProps): ReactElement {
	const plane = useSurfaceContext()?.plane ?? null;
	const paint = useThemeColor(resolveTableFadeToken({ plane, variant }));
	const faded = transparentOf(paint);
	const slots = tableVariants({ size, variant });

	const offset = useSharedValue(0);
	const viewport = useSharedValue(0);
	const content = useSharedValue(contentWidth);

	const handler = useAnimatedScrollHandler({
		onScroll: (event) => {
			offset.value = event.contentOffset.x;
			viewport.value = event.layoutMeasurement.width;
			content.value = event.contentSize.width;
		},
	});

	// Seeded from layout too: a table that has not been scrolled yet has fired
	// no scroll event, and the end fade has to be there from the first frame.
	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			viewport.value = event.nativeEvent.layout.width;
		},
		[viewport]
	);
	const handleContentSizeChange = useCallback(
		(width: number) => {
			content.value = width;
		},
		[content]
	);

	const startStyle = useAnimatedStyle(() => ({
		opacity: resolveTableEdgeFade({
			contentWidth: content.value,
			offset: offset.value,
			viewportWidth: viewport.value,
		}).start,
	}));
	const endStyle = useAnimatedStyle(() => ({
		opacity: resolveTableEdgeFade({
			contentWidth: content.value,
			offset: offset.value,
			viewportWidth: viewport.value,
		}).end,
	}));

	const fades =
		isScrollable && paint && faded ? (
			<>
				<Animated.View className={slots.fadeStart()} pointerEvents="none" style={startStyle}>
					<LinearGradient
						colors={[paint, faded]}
						end={{ x: 1, y: 0 }}
						start={{ x: 0, y: 0 }}
						style={StyleSheet.absoluteFill}
					/>
				</Animated.View>
				<Animated.View className={slots.fadeEnd()} pointerEvents="none" style={endStyle}>
					<LinearGradient
						colors={[faded, paint]}
						end={{ x: 1, y: 0 }}
						start={{ x: 0, y: 0 }}
						style={StyleSheet.absoluteFill}
					/>
				</Animated.View>
			</>
		) : null;

	return (
		<View className={slots.scroll()}>
			<Animated.ScrollView
				bounces={isScrollable}
				horizontal
				onContentSizeChange={handleContentSizeChange}
				onLayout={handleLayout}
				onScroll={handler}
				scrollEnabled={isScrollable}
				scrollEventThrottle={16}
				showsHorizontalScrollIndicator={false}
			>
				<View style={{ width: contentWidth }}>{children}</View>
			</Animated.ScrollView>
			{fades}
		</View>
	);
}
TableScroll.displayName = "DelacourUI.Table.Scroll";
