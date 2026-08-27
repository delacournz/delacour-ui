import { type ReactElement, type ReactNode, useCallback, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View, type ViewProps } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useAccordionItemPart, useAccordionPart } from "./accordion.context";
import { ACCORDION_CONTENT_FADE, ACCORDION_UNMEASURED, accordionVariants } from "./accordion.variants";

export type AccordionContentProps = Omit<ViewProps, "style"> & {
	className?: string;
	children?: ReactNode;
};

/**
 * The panel an item discloses.
 *
 * **Its height is measured and animated, never laid out.** The outer view clips,
 * and its height runs from zero to whatever the inner view reported. The animation
 * therefore lives on this one node: whatever sits below follows it through
 * ordinary layout, with nothing to opt into. The alternative — unmounting the
 * content and letting a whole-tree layout transition reflow the screen — makes
 * every sibling on the page a participant in this component's animation.
 *
 * The inner view is **out of flow**, so its height is its content's and can never
 * be fed back the clip's own animated one. In flow it is laid out against that
 * height, and a panel measured while the clip sits at zero reports its padding and
 * nothing else.
 *
 * **The content mounts on first expand and stays mounted.** Nothing renders until
 * an item is first opened, so a screen of collapsed panels costs an empty view
 * each; once opened, the subtree survives every later collapse with its scroll
 * position, its form state and its media intact. A panel that unmounted would
 * destroy all three on every tap.
 *
 * That is what the three accessibility props are for. Mounted content is content a
 * screen reader will read and a finger can reach, so a collapsed panel has to say
 * it is not there — an unmounting accordion never has to think about this.
 *
 * **It reports its first measurement and never starts the travel itself.** The
 * item owns the spring alone; see `onMeasured` on the item context for the race
 * that rule exists to close.
 */
export function AccordionContent({ className, children, ...props }: AccordionContentProps): ReactElement {
	const { size } = useAccordionPart("Accordion.Content");
	const { contentHeight, isExpanded, onMeasured, progress } = useAccordionItemPart("Accordion.Content");
	const slots = accordionVariants({ size });

	// Adjusted during render rather than in an effect, so the panel mounts in the
	// same commit as the tap that opened it. Waiting a frame would put the first
	// measurement — and therefore the start of the travel — one frame later still.
	const [hasExpanded, setHasExpanded] = useState(isExpanded);
	if (isExpanded && !hasExpanded) setHasExpanded(true);

	// Whether this panel has ever reported a height. Until it has, the clip must
	// not constrain anything — see `accordionStyleSheet.measuring` below.
	const [isMeasured, setMeasured] = useState(false);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const wasMeasured = contentHeight.value > ACCORDION_UNMEASURED;
			contentHeight.value = event.nativeEvent.layout.height;

			// The panel reports its first measurement and stops there — it must not
			// start the travel itself. `onLayout` is dispatched from the native side
			// and can land either side of React's effects, so a spring started here
			// is sometimes cancelled a moment later by the cleanup of the item's
			// effect it raced, leaving the panel shut and the indicator pointing the
			// wrong way. Telling the item instead leaves one owner of the spring.
			if (wasMeasured) return;
			setMeasured(true);
			onMeasured();
		},
		[contentHeight, onMeasured]
	);

	// Height and opacity off the one `progress`, never off a timing of their own —
	// so there is no second clock the panel's position can drift from. The fade
	// closes before the height does, which is what keeps the content legible for
	// most of the travel rather than half transparent at its midpoint.
	const clipStyle = useAnimatedStyle(() => ({
		height: progress.value * Math.max(contentHeight.value, 0),
		opacity: interpolate(
			progress.value,
			[0, ACCORDION_CONTENT_FADE.start, ACCORDION_CONTENT_FADE.end, 1],
			[0, 0, 1, 1]
		),
	}));

	return (
		<Animated.View
			accessibilityElementsHidden={!isExpanded}
			className={slots.content()}
			importantForAccessibility={isExpanded ? "auto" : "no-hide-descendants"}
			// Never `auto` while measuring: the clip is stretched over its own item
			// for that commit, and an invisible layer over a trigger is a tap that
			// goes nowhere.
			pointerEvents={isExpanded && isMeasured ? "auto" : "none"}
			style={isMeasured ? clipStyle : accordionStyleSheet.measuring}
		>
			{hasExpanded ? (
				<View className={slots.contentInner({ className })} onLayout={handleLayout} {...props}>
					{children}
				</View>
			) : null}
		</Animated.View>
	);
}
AccordionContent.displayName = "DelacourUI.Accordion.Content";

const accordionStyleSheet = StyleSheet.create({
	/**
	 * What the clip wears until its panel has reported a height.
	 *
	 * Absolutely positioned over its own item, so it is out of the item's layout and
	 * nothing on screen moves while it measures, and transparent, so nothing shows
	 * either. What matters is what it is *not*: it is not `height: 0`. A clip
	 * already at zero squashes an in-flow child to its padding, and never fires
	 * `onLayout` at all for an out-of-flow one — its frame is empty, so no layout
	 * event is emitted and the measurement arrives only when something unrelated
	 * forces a relayout, minutes later or never. Both were found on a simulator.
	 *
	 * The switch to the animated clip happens on the commit the measurement lands,
	 * while `progress` is still zero — so the panel goes from taking no space to
	 * taking none, and the travel starts from there.
	 */
	measuring: { bottom: 0, left: 0, opacity: 0, position: "absolute", right: 0, top: 0 },
});
