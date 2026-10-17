import { type ReactElement, type ReactNode, useEffect, useMemo } from "react";
import { I18nManager, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { IconChevronRight } from "../../icons/central";
import { Icon, type IconDefaults, IconDefaultsProvider } from "../icon";
import { Pressable } from "../pressable";
import { useTreeItemPart, useTreePart } from "./tree.context";
import {
	resolveTreeIndicatorForeground,
	resolveTreeIndicatorHitSlop,
	resolveTreeIndicatorRotation,
	TREE_SPRING,
	treeVariants,
} from "./tree.variants";

export type TreeIndicatorProps = {
	className?: string;
	/** A glyph to turn in place of the chevron. Drawn pointing toward the label at rest. */
	children?: ReactNode;
};

/**
 * The chevron that opens and closes a branch — always, whatever `expandOnPress`
 * says, so a select-only row still has a way in.
 *
 * On a leaf it renders the same width of nothing, so a leaf's label lines up with
 * its sibling branches'. It is composed into a trigger that holds none.
 *
 * **It is a `Pressable` of its own, beside the row's rather than inside it.** Two
 * nested tap gestures race for the same touch; siblings do not. Its column is
 * narrower than a touch target, so it takes a hit slop out to 44 points.
 *
 * **Hidden from assistive technology.** The row announces `expanded` and offers
 * expand and collapse as custom actions, so a second element saying the same
 * thing would only be one more swipe.
 *
 * Turns a quarter on `Collapsible`'s spring. Reanimated's default reduce-motion
 * policy snaps it. Mirrored and turned the other way under right-to-left.
 */
export function TreeIndicator({ className, children }: TreeIndicatorProps): ReactElement {
	const { haptic, size } = useTreePart("Tree.Indicator");
	const { isBranch, isDisabled, isExpanded, isSelected, toggle } = useTreeItemPart("Tree.Indicator");
	const slots = treeVariants({ size });
	const glyphClassName = slots.glyph();
	const isRTL = I18nManager.isRTL;

	const target = resolveTreeIndicatorRotation({ isExpanded, isRTL });
	const rotation = useSharedValue(target);

	useEffect(() => {
		rotation.value = withSpring(target, TREE_SPRING);
	}, [rotation, target]);

	const rotationStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }, { scaleX: isRTL ? -1 : 1 }],
	}));

	const iconDefaults = useMemo<IconDefaults>(
		() => ({ className: glyphClassName, color: resolveTreeIndicatorForeground({ isSelected }) }),
		[glyphClassName, isSelected]
	);

	if (!isBranch) {
		return (
			<View
				accessibilityElementsHidden
				className={slots.indicator({ className })}
				importantForAccessibility="no-hide-descendants"
			/>
		);
	}

	return (
		<Pressable
			accessibilityElementsHidden
			accessible={false}
			className={slots.indicator({ className })}
			disabled={isDisabled}
			feedback="fade"
			haptic={haptic}
			hitSlop={resolveTreeIndicatorHitSlop(size)}
			importantForAccessibility="no-hide-descendants"
			onPress={toggle}
		>
			<Animated.View style={rotationStyle}>
				<IconDefaultsProvider value={iconDefaults}>{children ?? <Icon icon={IconChevronRight} />}</IconDefaultsProvider>
			</Animated.View>
		</Pressable>
	);
}
TreeIndicator.displayName = "DelacourUI.Tree.Indicator";
