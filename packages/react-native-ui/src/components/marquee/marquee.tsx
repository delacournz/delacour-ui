import { type ReactElement, type ReactNode, useState } from "react";
import { type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useLoopingMotion } from "../../hooks/use-looping-motion";
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
	/** Freezes the strip where it is; resuming carries on from there. Wire it to your own pause control. A `Marquee.Group`'s pause wins. Controlled. */
	isPaused?: boolean;
	/** Whether the strip starts paused when `isPaused` is not set. Default `false`. */
	defaultPaused?: boolean;
	/** Called when the pause or resume accessibility action changes it — offered only when `accessibilityLabel` is set, for Switch Control and Voice Control. */
	onPausedChange?: (isPaused: boolean) => void;
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
	isPaused,
	defaultPaused,
	onPausedChange,
	className,
	contentClassName,
	onLayout,
	...props
}: MarqueeProps): ReactElement {
	const group = useMarqueeGroup();
	const motion = useLoopingMotion({
		defaultPaused,
		isPaused: group ? group.isPaused : isPaused,
		onPausedChange: group ? group.onPausedChange : onPausedChange,
	});
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

	// Calm motion or a screen reader swaps the moving track for a still,
	// hand-scrollable strip, live if either flips; a user pause keeps the track
	// and freezes it. A label makes the root one accessible element that speaks
	// for content it hides, and only then does it carry the pause actions —
	// otherwise the root would swallow its children's own accessibility.
	const actions = isContentHidden
		? { accessibilityActions: motion.accessibilityActions, onAccessibilityAction: motion.onAccessibilityAction }
		: undefined;

	return (
		<View
			accessibilityLabel={accessibilityLabel}
			accessible={isContentHidden ? true : undefined}
			{...actions}
			className={slots.root({ className: cn(className) })}
			onLayout={onRootLayout}
			{...props}
		>
			{motion.isAtRest ? (
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
					isFrozen={motion.hold === "paused"}
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
 * child `Pressable` still gets its tap), and held for good under reduce motion,
 * `isMotionCalm` or a screen reader, where it becomes a still strip scrolled by hand. `isPaused`
 * freezes it in place for an app's own pause control (WCAG 2.2.2). A vertical
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
