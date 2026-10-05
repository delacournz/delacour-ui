import { type ReactElement, useEffect } from "react";
import type { ViewProps } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { useSectionRailPart } from "./section-rail.context";
import { resolveBarLength, sectionRailVariants } from "./section-rail.variants";

export type SectionRailBarProps = Omit<ViewProps, "children"> & {
	/** The section this bar stands for — the same value as its `SectionRail.Item`. */
	value: string;
	/** Nesting depth. Each level is one step shorter; 2 and deeper share the shortest. */
	level?: number;
	className?: string;
};

/** How long an active bar's colour takes to ease in or out, in ms. */
const BAR_FADE_MS = 120;

/**
 * One section's bar on the rail.
 *
 * A resting track with the active colour as a layer over it, faded in over
 * 120ms — so the colour eases without either token being resolved in
 * JavaScript. Reduce motion snaps it.
 *
 * Must be a **direct child** of `SectionRail.Trigger`: its `onLayout` reports a
 * box relative to its parent, and the scrub maps the finger through those boxes.
 * Hidden from assistive technology; the trigger speaks for every bar.
 */
export function SectionRailBar({ value, level = 0, className, onLayout, ...props }: SectionRailBarProps): ReactElement {
	const { activeValue, layoutBar, mountBar } = useSectionRailPart("SectionRail.Bar");
	const isActive = activeValue === value;
	const isReducedMotion = useReducedMotion();
	const slots = sectionRailVariants();
	const handleLayout = layoutBar(value);

	useEffect(() => mountBar(value), [mountBar, value]);

	const fill = useSharedValue(isActive ? 1 : 0);
	useEffect(() => {
		const target = isActive ? 1 : 0;
		fill.value = isReducedMotion ? target : withTiming(target, { duration: BAR_FADE_MS });
	}, [fill, isActive, isReducedMotion]);
	const fillStyle = useAnimatedStyle(() => ({ opacity: fill.value }));

	return (
		<Animated.View
			accessibilityElementsHidden
			className={slots.bar({ className: [resolveBarLength(level), className] })}
			importantForAccessibility="no-hide-descendants"
			onLayout={(event) => {
				handleLayout(event);
				onLayout?.(event);
			}}
			{...props}
		>
			<Animated.View className={slots.barFill()} style={fillStyle} />
		</Animated.View>
	);
}
SectionRailBar.displayName = "DelacourUI.SectionRail.Bar";
