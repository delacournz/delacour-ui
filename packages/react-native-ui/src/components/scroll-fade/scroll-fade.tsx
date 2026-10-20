import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { type ScrollSource, useResolvedScrollSource } from "../../hooks/use-scroll-source";
import { useThemeColor } from "../../hooks/use-theme-color";
import { transparentOf } from "../../lib/color";
import { resolveFadeEdges } from "../../lib/scroll-edges";
import {
	SCROLL_FADE_DEFAULT_DISTANCE,
	SCROLL_FADE_DEFAULT_SIZE,
	type ScrollFadeEdges,
	scrollFadeVariants,
} from "./scroll-fade.variants";
import { ScrollFadeEdge } from "./scroll-fade-edge";

export type ScrollFadeProps = Omit<ViewProps, "pointerEvents"> & {
	/** The scrollable (and anything else) the fade overlays. Fades paint after it, so they sit on top. */
	children: ReactNode;
	/** Fade depth in points. @default 48 */
	size?: number;
	/** Which edges fade. @default "both" */
	edges?: ScrollFadeEdges;
	/**
	 * Colour the content fades into — a theme token (`card`) or a literal.
	 * Defaults to the `background` token; name the surface it sits on, or it
	 * reads as a grey band.
	 */
	color?: string;
	/** Travel in points from clear to full. 0 makes each edge a step. @default 24 */
	fadeInDistance?: number;
	/** Points to hold the start fade in from its edge, e.g. under a bar this component cannot see. @default 0 */
	insetStart?: number;
	/** Points to hold the end fade in from its edge. @default 0 */
	insetEnd?: number;
	/** Explicit source; otherwise the nearest `ScrollSourceProvider` / the enclosing `Screen`. */
	scrollSource?: ScrollSource;
	/** Draw nothing without unmounting. @default true */
	enabled?: boolean;
	className?: string;
};

/**
 * A gradient at a scrollable's start and end edges while there is more content
 * past them, so content reads as passing beneath the boundary rather than
 * being cut. Vertical or horizontal — the axis is the source's.
 *
 * **It overlays, it does not wrap.** The scrollable is a child, and the fades
 * paint after it, but nothing here touches its props: the source comes from
 * `useScrollSource` (spread its `scrollProps` onto the scrollable yourself), or
 * from the enclosing `Screen`, which publishes one.
 *
 * **Each edge is in only while there is content past it.** The start arrives
 * over the first `fadeInDistance` points of travel, the end leaves over the
 * last, and a list too short to scroll draws neither. Before a source has
 * measured anything the end is drawn — a Screen learns its sizes on the first
 * scroll event, and a tall body must show its end fade at rest.
 *
 * **Name the surface.** The fade is a colour, not a mask, so over a `card` it
 * must be the card's colour; the default `background` over a card is a grey
 * band. The far stop is that colour at zero alpha, never `transparent`, and a
 * colour whose alpha cannot be taken off draws no fade at all.
 *
 * @example
 * const { source, scrollProps } = useScrollSource({ orientation: "horizontal" });
 *
 * <ScrollFade scrollSource={source} size={40}>
 *   <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} {...scrollProps}>
 *     {cards}
 *   </Animated.ScrollView>
 * </ScrollFade>
 *
 * @example
 * // Inside a Screen: no wiring.
 * <ScrollFade className="flex-1">
 *   <Screen.ScrollArea>{rows}</Screen.ScrollArea>
 * </ScrollFade>
 */
export function ScrollFade({
	children,
	size = SCROLL_FADE_DEFAULT_SIZE,
	edges = "both",
	color,
	fadeInDistance = SCROLL_FADE_DEFAULT_DISTANCE,
	insetStart = 0,
	insetEnd = 0,
	scrollSource,
	enabled = true,
	className,
	...props
}: ScrollFadeProps): ReactElement {
	const source = useResolvedScrollSource("ScrollFade", scrollSource);
	const paint = useThemeColor(color ?? "background");
	const faded = transparentOf(paint);
	const draw = resolveFadeEdges(enabled ? edges : "none");

	// Without a colour to fade from there is no honest gradient, and the keyword
	// `transparent` is no substitute — so the content renders alone.
	const canDraw = paint !== undefined && faded !== undefined;

	return (
		<View className={scrollFadeVariants().root({ className })} {...props}>
			{children}
			{canDraw && draw.start ? (
				<ScrollFadeEdge
					color={paint}
					edge="start"
					fadeInDistance={fadeInDistance}
					faded={faded}
					inset={insetStart}
					size={size}
					source={source}
				/>
			) : null}
			{canDraw && draw.end ? (
				<ScrollFadeEdge
					color={paint}
					edge="end"
					fadeInDistance={fadeInDistance}
					faded={faded}
					inset={insetEnd}
					size={size}
					source={source}
				/>
			) : null}
		</View>
	);
}
ScrollFade.displayName = "DelacourUI.ScrollFade";
