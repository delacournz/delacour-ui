import { type ReactElement, type ReactNode, useCallback, useEffect } from "react";
import { type LayoutChangeEvent, View, type ViewProps } from "react-native";
import type { BlurLayerComponent } from "../scroll-blur/scroll-blur.types";
import { useScrollHeaderPart } from "./scroll-header.context";
import {
	SCROLL_HEADER_DEFAULT_BLUR_INTENSITY,
	type ScrollHeaderBarSurface as ScrollHeaderBarSurfaceName,
	scrollHeaderVariants,
} from "./scroll-header.variants";
import { ScrollHeaderBarSurface } from "./scroll-header-bar-surface";

export type ScrollHeaderBarProps = ViewProps & {
	/**
	 * `plain` background, `muted` fill, `none` transparent (over a cover), `blur` frosted.
	 * The surface fades in with collapse progress; `blur` falls back to `plain` with no engine
	 * or under Reduce Transparency. @default "plain"
	 */
	surface?: ScrollHeaderBarSurfaceName;
	/** Hairline under the bar, fading in with the surface. @default true */
	divider?: boolean;
	/** Blur strength, 0-100, `surface="blur"` only. @default 40 */
	intensity?: number;
	/** Explicit bar content height in points, before the safe-area band; measured when omitted. */
	barHeight?: number;
	/** Engine override; otherwise the nearest `ScrollBlurLayerProvider`. */
	layer?: BlurLayerComponent;
	children?: ReactNode;
	className?: string;
};

/**
 * The compact bar pinned to the top: the safe-area band, then one row of controls.
 *
 * Measures its row into the root, so the scroller's inset and the Large block's position follow
 * the real height rather than a guess; `barHeight` skips the measurement for a bar whose height
 * is known. The row is `h-navbar-row`, the same token `Screen.Navbar` uses, so swapping one for
 * the other does not move the row.
 *
 * Its controls are always mounted and always opaque — only the surface behind them fades — so
 * they stay reachable, and focusable, whether the header is open or collapsed. Every layout box
 * is `box-none`, so the bar swallows no touch meant for the content beneath it.
 */
export function ScrollHeaderBar({
	surface = "plain",
	divider = true,
	intensity = SCROLL_HEADER_DEFAULT_BLUR_INTENSITY,
	barHeight: explicitBarHeight,
	layer,
	className,
	children,
	...props
}: ScrollHeaderBarProps): ReactElement {
	const { safeAreaTop, barHeight } = useScrollHeaderPart("ScrollHeader.Bar");
	const slots = scrollHeaderVariants();

	useEffect(() => {
		if (explicitBarHeight !== undefined) barHeight.value = explicitBarHeight;
	}, [explicitBarHeight, barHeight]);

	const handleRowLayout = useCallback(
		(event: LayoutChangeEvent) => {
			if (explicitBarHeight === undefined) barHeight.value = event.nativeEvent.layout.height;
		},
		[explicitBarHeight, barHeight]
	);

	return (
		<View className={slots.bar({ className })} pointerEvents="box-none" {...props}>
			<ScrollHeaderBarSurface divider={divider} intensity={intensity} layer={layer} surface={surface} />
			<View pointerEvents="box-none" style={{ paddingTop: safeAreaTop }}>
				<View
					className={slots.barRow()}
					onLayout={handleRowLayout}
					pointerEvents="box-none"
					style={explicitBarHeight === undefined ? undefined : { height: explicitBarHeight }}
				>
					{children}
				</View>
			</View>
		</View>
	);
}
ScrollHeaderBar.displayName = "DelacourUI.ScrollHeader.Bar";
