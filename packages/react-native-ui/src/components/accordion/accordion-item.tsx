import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { View, type ViewProps } from "react-native";
import { cancelAnimation, useSharedValue, withSpring } from "react-native-reanimated";
import { type AccordionItemContextValue, AccordionItemProvider, useAccordionPart } from "./accordion.context";
import {
	ACCORDION_SPRING,
	ACCORDION_UNMEASURED,
	accordionVariants,
	isItemExpanded,
	resolveAccordionItemAxes,
} from "./accordion.variants";

export type AccordionItemProps = Omit<ViewProps, "children"> & {
	/** What this item is called in the accordion's value. Must be unique within one. */
	value: string;
	/** Blocks the trigger and fades the row. Inherited from the enclosing accordion. */
	isDisabled?: boolean;
	className?: string;
	children?: ReactNode;
};

/**
 * One section of an accordion: a trigger, and the panel it discloses.
 *
 * Owns the two shared values every animated style on this item reads —
 * `progress` and the panel's measured height — and the one spring that drives
 * them. One source for the height, the fade and the indicator's rotation, so the
 * three cannot drift out of step by a frame.
 *
 * `progress` is seeded from the settled state rather than from zero, so an item
 * mounted open does not animate itself open on its first paint — `Switch`'s rule.
 *
 * An item is expected to hold an `Accordion.Content`. One without a panel has
 * nothing to measure and therefore nothing to travel against, so its indicator
 * stays put — which is the right outcome for a row that discloses nothing.
 */
export function AccordionItem({ value, isDisabled, className, children, ...props }: AccordionItemProps): ReactElement {
	const { expanded, isDisabled: accordionDisabled, size } = useAccordionPart("Accordion.Item");
	const axes = resolveAccordionItemAxes({ own: { isDisabled }, root: { isDisabled: accordionDisabled } });
	const isExpanded = isItemExpanded(expanded, value);

	const progress = useSharedValue(isExpanded ? 1 : 0);
	const contentHeight = useSharedValue(ACCORDION_UNMEASURED);

	// Bumped the first time this item's panel reports a height, purely to make the
	// effect below run again. See `onMeasured` on the item context for why the
	// panel must not start the spring itself.
	const [measurements, setMeasurements] = useState(0);
	const onMeasured = useCallback(() => setMeasurements((count) => count + 1), []);

	// `measurements` is not read in the body — being unread is the whole point of
	// it, the way `settledDrags` is for a `Switch`. The first expand of a panel
	// that has never been mounted has no height to travel against, so this run
	// bails; the measurement that follows is what brings it back.
	// biome-ignore lint/correctness/useExhaustiveDependencies: the extra dependency is the re-run trigger, see above
	useEffect(() => {
		if (isExpanded && contentHeight.value === ACCORDION_UNMEASURED) return;

		progress.value = withSpring(isExpanded ? 1 : 0, ACCORDION_SPRING);

		// Without this an item unmounted mid-travel leaves its spring running.
		return () => cancelAnimation(progress);
	}, [contentHeight, isExpanded, measurements, progress]);

	const context = useMemo<AccordionItemContextValue>(
		() => ({ contentHeight, isDisabled: axes.isDisabled, isExpanded, onMeasured, progress, value }),
		[axes.isDisabled, contentHeight, isExpanded, onMeasured, progress, value]
	);

	return (
		<AccordionItemProvider value={context}>
			<View className={accordionVariants({ isDisabled: axes.isDisabled, size }).item({ className })} {...props}>
				{children}
			</View>
		</AccordionItemProvider>
	);
}
AccordionItem.displayName = "DelacourUI.Accordion.Item";
