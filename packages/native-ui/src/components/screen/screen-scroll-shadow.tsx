import { type ReactElement, useId } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useScreenPart } from "./screen.context";

/** How tall the fade is, in points, when a caller names no size. */
const SCROLL_SHADOW_SIZE = 28;

/** Which ends of the scrollable fade. */
export const SCROLL_SHADOW_EDGES = ["top", "bottom", "both"] as const;
export type ScreenScrollShadowEdge = (typeof SCROLL_SHADOW_EDGES)[number];

export type ScreenScrollShadowProps = Omit<ViewProps, "children" | "pointerEvents"> & {
	/** How tall the fade is, in points. @default SCROLL_SHADOW_SIZE */
	size?: number;
	/** Which ends fade. @default "both" */
	edges?: ScreenScrollShadowEdge;
	/**
	 * The colour the content fades into.
	 *
	 * Defaults to the `background` token, which is what a screen paints. Name
	 * another when the shadow sits over a different surface — a `card`, say —
	 * because a fade into the wrong colour reads as a grey band rather than as
	 * the content running out.
	 */
	color?: string;
	/**
	 * Extra points to push the top fade down, ON TOP OF the navbar's own height.
	 *
	 * For chrome this package does not know about — a bar floating over the
	 * content between the navbar and the body. The navbar and footer are already
	 * accounted for; this is only what a caller adds beyond them.
	 */
	insetTop?: number;
	/** Extra points to lift the bottom fade, on top of the footer's own height. */
	insetBottom?: number;
	className?: string;
};

/**
 * A fade at each end of the screen's scrollable, for content that runs past it.
 *
 * The problem it solves is that a scrollable with a hard edge looks finished. A
 * row cut exactly in half by the bottom of the viewport reads as a layout bug;
 * the same row fading out reads as more to come. That signal matters most under
 * chrome that floats over the content, where the cut lands mid-component and
 * there is no bar edge to explain it.
 *
 * **It is a sibling of the scrollable, not a wrapper around it.** The screen
 * context already publishes `scrollY`, `contentHeight` and `layoutHeight` from
 * whichever body is mounted, so this reads the numbers rather than intercepting
 * them. Wrapping would mean cloning the child to attach an `onScroll`, and every
 * scrollable this package ships already has one of its own — the reserve
 * animations in `use-screen-scroll-insets` are driven by it — so a second writer
 * would take a handler that is already spoken for.
 *
 * It follows that this works over any of them: `ScrollArea`, `FlatList`,
 * `SectionList`, `LegendList` and `ChatList` all publish to the same context.
 *
 * **It places itself against the screen's own chrome.** The top fade starts at
 * the navbar's measured height and the bottom above the footer's, both read from
 * the same context, so it is correct under either placement without a caller
 * measuring anything. `insetTop` and `insetBottom` are for chrome this package
 * cannot see — a bar floating between the navbar and the body.
 *
 * **Each end fades only when there is something past it.** The top is out at
 * rest and arrives over the first `size` points of travel; the bottom is there
 * from the start and leaves over the last `size`. Content shorter than its
 * viewport never scrolls, so `maxScroll` is zero and both stay out — a fade over
 * a short page would be an edge that promises content that does not exist.
 *
 * **The gradient is `react-native-svg`, not a native gradient view.** The
 * package is already a peer for `Icon` and `Spinner`, so this costs nothing new,
 * and the alternative would add a native module to every consuming app for two
 * rectangles. Both stops name the same colour and vary only in opacity: fading
 * to `transparent` interpolates through black in a premultiplied space, which
 * shows as a dark bloom against a light background.
 *
 * @example
 * <Screen>
 *   <Screen.ScrollArea>{rows}</Screen.ScrollArea>
 *   <Screen.ScrollShadow />
 * </Screen>
 *
 * @example
 * // Under a bar floating over the content.
 * <Screen.ScrollShadow insetTop={barHeight} />
 */
export function ScreenScrollShadow({
	size = SCROLL_SHADOW_SIZE,
	edges = "both",
	color,
	insetTop = 0,
	insetBottom = 0,
	className,
	style,
	...props
}: ScreenScrollShadowProps): ReactElement {
	const { scrollY, contentHeight, layoutHeight, navbar, footer } = useScreenPart("Screen.ScrollShadow");
	const background = useThemeColor("background");
	const paint = color ?? background ?? "transparent";
	// Two gradients cannot share one id, and a screen may hold more than one of
	// these — a fade over a card inside a faded page.
	const id = useId();

	// The chrome's height is part of the position, not something a caller adds.
	// This fills the whole screen, so a fade placed at zero would sit behind the
	// navbar under a static one and under an overlay one alike — visible in
	// neither, which is a component that silently does nothing.
	const topStyle = useAnimatedStyle(() => ({
		opacity: interpolate(scrollY.value, [0, size], [0, 1], "clamp"),
		top: navbar.height.value + insetTop,
	}));

	const bottomStyle = useAnimatedStyle(() => {
		const maxScroll = contentHeight.value - layoutHeight.value;
		const bottom = footer.height.value + footer.overlayHeight.value + insetBottom;
		if (maxScroll <= 0) return { bottom, opacity: 0 };

		return { bottom, opacity: interpolate(scrollY.value, [maxScroll - size, maxScroll], [1, 0], "clamp") };
	});

	return (
		<View className={className} pointerEvents="none" style={[StyleSheet.absoluteFill, style]} {...props}>
			{edges === "bottom" ? null : (
				<Animated.View style={[{ height: size, left: 0, position: "absolute", right: 0 }, topStyle]}>
					<Svg height="100%" width="100%">
						<Defs>
							<LinearGradient id={`${id}-top`} x1="0" x2="0" y1="0" y2="1">
								<Stop offset="0" stopColor={paint} stopOpacity="1" />
								<Stop offset="1" stopColor={paint} stopOpacity="0" />
							</LinearGradient>
						</Defs>
						<Rect fill={`url(#${id}-top)`} height="100%" width="100%" />
					</Svg>
				</Animated.View>
			)}

			{edges === "top" ? null : (
				<Animated.View style={[{ height: size, left: 0, position: "absolute", right: 0 }, bottomStyle]}>
					<Svg height="100%" width="100%">
						<Defs>
							<LinearGradient id={`${id}-bottom`} x1="0" x2="0" y1="0" y2="1">
								<Stop offset="0" stopColor={paint} stopOpacity="0" />
								<Stop offset="1" stopColor={paint} stopOpacity="1" />
							</LinearGradient>
						</Defs>
						<Rect fill={`url(#${id}-bottom)`} height="100%" width="100%" />
					</Svg>
				</Animated.View>
			)}
		</View>
	);
}
ScreenScrollShadow.displayName = "DelacourUI.Screen.ScrollShadow";
