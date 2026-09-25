import { type ReactElement, type ReactNode, useCallback, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View, type ViewProps } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useCollapsiblePart } from "./collapsible.context";
import {
	COLLAPSIBLE_CONTENT_FADE,
	COLLAPSIBLE_UNMEASURED,
	collapsibleVariants,
	resolveCollapsibleAccessibility,
} from "./collapsible.variants";

export type CollapsibleContentProps = Omit<ViewProps, "style"> & {
	className?: string;
	children?: ReactNode;
};

/**
 * The body the trigger discloses.
 *
 * **Its height is measured and animated, never laid out.** The outer view clips,
 * and its height runs from zero to whatever the inner view reported, so the
 * animation lives on this one node and whatever sits below follows it through
 * ordinary layout — nothing on the screen has to opt into anything.
 *
 * **The content mounts on first open and stays mounted**, so a form keeps what was
 * typed and a list keeps where it was scrolled across every later close. A closed
 * panel is therefore taken out of the accessibility tree and stops taking touches,
 * rather than merely clipped to zero.
 *
 * It reports its first measurement and never starts the travel itself — the root
 * owns the spring alone. See `onMeasured` on the context.
 *
 * `className` lands on the inner, measured layer, so padding set there is part of
 * what the panel measures.
 */
export function CollapsibleContent({ className, children, ...props }: CollapsibleContentProps): ReactElement {
	const { contentHeight, isDisabled, isOpen, onMeasured, progress, size } = useCollapsiblePart("Collapsible.Content");
	const slots = collapsibleVariants({ size });
	const { content: a11y } = resolveCollapsibleAccessibility({ isDisabled, isOpen });

	// Adjusted during render rather than in an effect, so the panel mounts in the
	// same commit as the tap that opened it.
	const [hasOpened, setHasOpened] = useState(isOpen);
	if (isOpen && !hasOpened) setHasOpened(true);

	const [isMeasured, setMeasured] = useState(false);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const wasMeasured = contentHeight.value > COLLAPSIBLE_UNMEASURED;
			contentHeight.value = event.nativeEvent.layout.height;
			if (wasMeasured) return;
			setMeasured(true);
			onMeasured();
		},
		[contentHeight, onMeasured]
	);

	const clipStyle = useAnimatedStyle(() => ({
		height: progress.value * Math.max(contentHeight.value, 0),
		opacity: interpolate(
			progress.value,
			[0, COLLAPSIBLE_CONTENT_FADE.start, COLLAPSIBLE_CONTENT_FADE.end, 1],
			[0, 0, 1, 1]
		),
	}));

	// Never `auto` while measuring: the clip is stretched over the collapsible for
	// that commit, and an invisible layer over the trigger is a tap that goes nowhere.
	const pointerEvents = isOpen && isMeasured ? "auto" : "none";

	return (
		<Animated.View
			accessibilityElementsHidden={a11y.accessibilityElementsHidden}
			className={slots.content()}
			importantForAccessibility={a11y.importantForAccessibility}
			pointerEvents={pointerEvents}
			style={isMeasured ? clipStyle : collapsibleStyleSheet.measuring}
		>
			{hasOpened ? (
				<View className={slots.contentInner({ className })} onLayout={handleLayout} {...props}>
					{children}
				</View>
			) : null}
		</Animated.View>
	);
}
CollapsibleContent.displayName = "DelacourUI.Collapsible.Content";

const collapsibleStyleSheet = StyleSheet.create({
	/**
	 * What the clip wears until the panel has reported a height.
	 *
	 * Absolutely positioned and transparent, so nothing on screen moves while it
	 * measures — and deliberately not `height: 0`, because an out-of-flow child
	 * mounted into a zero-height parent never fires `onLayout` at all. Found on a
	 * simulator by `Accordion.Content`, which carries the same sheet.
	 */
	measuring: { bottom: 0, left: 0, opacity: 0, position: "absolute", right: 0, top: 0 },
});
