import { type ReactElement, type ReactNode, useState } from "react";
import { type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { cn } from "../../lib/cn";
import { useMarqueeGroup } from "./marquee.context";
import {
	MARQUEE_DEFAULT_EASE_MS,
	type MarqueeDirection,
	type MarqueeFade as MarqueeFadeSpec,
	type MarqueeGap,
	type MarqueePause,
	marqueeVariants,
	resolveMarqueeAxis,
	resolveMarqueeFade,
	resolveMarqueePause,
	resolveMarqueeSpeed,
} from "./marquee.variants";
import { MarqueeFade } from "./marquee-fade";
import { MarqueeGroup } from "./marquee-group";
import { MarqueeScroller } from "./marquee-scroller";
import { MarqueeTrack } from "./marquee-track";

export type MarqueeProps = Omit<ViewProps, "children"> & {
	children: ReactNode;
	/** Which way the content travels. Default `left`. */
	direction?: MarqueeDirection;
	/** Points per second — never a duration. Inherited from a `Marquee.Group`, else 40. */
	speed?: number;
	/** The trailing space after each copy, so the last item and the next copy's first are spaced like the rest. Default `md`. */
	gap?: MarqueeGap;
	/** Gradients at both edges, blending the content into the surface. Default `{ kind: "none" }`. */
	fade?: MarqueeFadeSpec;
	/** When the strip holds. Default `{ kind: "press" }`; a `Marquee.Group`'s pause wins. */
	pause?: MarqueePause;
	/** How long the strip takes to slow to a hold or get back up to speed, in ms. 0 is instant. Default 250. */
	easeMs?: number;
	/** One sentence for the whole strip — a logo wall, say. Set, the content is hidden from assistive technology and this speaks for it. */
	accessibilityLabel?: string;
	className?: string;
	/** Classes for the row (or column) wrapping each copy of the content. */
	contentClassName?: string;
};

function MarqueeRoot({
	children,
	direction = "left",
	speed,
	gap = "md",
	fade = { kind: "none" },
	pause,
	easeMs = MARQUEE_DEFAULT_EASE_MS,
	accessibilityLabel,
	className,
	contentClassName,
	onLayout,
	...props
}: MarqueeProps): ReactElement {
	const group = useMarqueeGroup();
	const isCalm = useCalmMotion();
	const ownPressed = useSharedValue(false);
	const [container, setContainer] = useState(0);

	const axis = resolveMarqueeAxis(direction);
	const slots = marqueeVariants({ axis, gap });
	const resolvedFade = resolveMarqueeFade(fade);
	const isContentHidden = accessibilityLabel !== undefined;
	const copyClassName = slots.copy({ className: contentClassName });

	const onRootLayout = (event: LayoutChangeEvent): void => {
		const { width, height } = event.nativeEvent.layout;
		setContainer(axis === "horizontal" ? width : height);
		onLayout?.(event);
	};

	// Calm motion swaps the moving track for a still, hand-scrollable strip, live
	// if the OS setting flips. A label makes the root one accessible element that
	// speaks for content it hides.
	return (
		<View
			accessibilityLabel={accessibilityLabel}
			accessible={isContentHidden ? true : undefined}
			className={slots.root({ className: cn(className) })}
			onLayout={onRootLayout}
			{...props}
		>
			{isCalm ? (
				<MarqueeScroller axis={axis} copyClassName={copyClassName} isContentHidden={isContentHidden}>
					{children}
				</MarqueeScroller>
			) : (
				<MarqueeTrack
					axis={axis}
					container={container}
					copyClassName={copyClassName}
					direction={direction}
					easeMs={easeMs}
					isContentHidden={isContentHidden}
					isPressed={group?.isPressed ?? ownPressed}
					pause={resolveMarqueePause(pause, group?.pause)}
					speed={resolveMarqueeSpeed(speed, group?.speed)}
					trackClassName={slots.track()}
				>
					{children}
				</MarqueeTrack>
			)}
			{resolvedFade ? (
				<MarqueeFade axis={axis} className={slots.fade()} color={resolvedFade.color} size={resolvedFade.size} />
			) : null}
		</View>
	);
}

/**
 * Content that travels across its container on a loop, at a constant speed in
 * points per second — a strip of badges, a wall of logos, a ticker of quotes.
 *
 * Any children, horizontal or vertical. Held while a finger is down on it (a
 * child `Pressable` still gets its tap), and held for good under reduce motion
 * or `isMotionCalm`, where it becomes a still strip scrolled by hand. A vertical
 * marquee needs a bounded height from its `className` — a column of unbounded
 * height has nothing to clip.
 *
 * Decoration, not navigation: no snapping, no index, no paging.
 *
 * @example
 * <Marquee fade={{ kind: "edges" }} speed={40}>
 *   <Badge>New</Badge>
 *   <Badge>Popular</Badge>
 * </Marquee>
 *
 * @example
 * <Marquee.Group speed={30}>
 *   <Marquee direction="left">…</Marquee>
 *   <Marquee direction="right">…</Marquee>
 * </Marquee.Group>
 */
export const Marquee = Object.assign(MarqueeRoot, {
	/** Holds one pause state and a default speed for every strip inside it. */
	Group: MarqueeGroup,
	displayName: "DelacourUI.Marquee",
});
