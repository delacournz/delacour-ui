import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Icon, type IconComponent } from "../icon";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { useFabActionItem, useFabGroupPart } from "./fab.context";
import { FAB_DIAL_STAGGER, FAB_FOREGROUND_TOKEN, fabVariants, resolveDialProgress } from "./fab.variants";

/** How far below its resting place a closed action sits, in points. */
const ACTION_RISE = 16;

/** An action's scale at the start of its window. */
const ACTION_START_SCALE = 0.6;

export type FabActionProps = {
	icon: IconComponent;
	/** The chip beside the button, and the button's accessibility label. */
	label: string;
	onPress: () => void;
	isDisabled?: boolean;
	/** Draws the glyph in the destructive colour. The surface stays the dial's. */
	isDestructive?: boolean;
	className?: string;
	labelClassName?: string;
	/** Lands on the round button. */
	testID?: string;
};

/**
 * One action in a `Fab.Group`'s dial: a small round button on the trigger's
 * centre line, and a label chip on the side facing into the screen.
 *
 * Takes its glyph as a prop rather than composing it, unlike `Fab`: the action
 * draws two things — a button and a chip — from one label and one icon, and
 * the dial owns how both look.
 *
 * Pressing runs the action, then closes the dial. The chip presses too, since a
 * finger aims at the words, but it is hidden from assistive technology so a
 * screen reader meets each action once.
 *
 * Its stagger window comes from its place in the dial, read on the UI thread
 * from the dial's one spring. Under reduced motion it fades in place.
 */
export function FabAction({
	icon,
	label,
	onPress,
	isDisabled = false,
	isDestructive = false,
	className,
	labelClassName,
	testID,
}: FabActionProps): ReactElement {
	const { progress, count, labelSide, size, haptic, isReducedMotion, close } = useFabGroupPart("Fab.Action");
	const { index } = useFabActionItem("Fab.Action");
	const slots = fabVariants({ size, labelSide, isDisabled });

	const style = useAnimatedStyle(() => {
		if (isReducedMotion) {
			const value = progress.value;
			return {
				opacity: value < 0 ? 0 : value > 1 ? 1 : value,
				transform: [{ translateY: 0 }, { scale: 1 }],
			};
		}
		const local = resolveDialProgress({ open: progress.value, index, count, stagger: FAB_DIAL_STAGGER });
		return {
			opacity: local,
			transform: [
				{ translateY: (1 - local) * ACTION_RISE },
				{ scale: ACTION_START_SCALE + (1 - ACTION_START_SCALE) * local },
			],
		};
	});

	const handlePress = () => {
		onPress();
		close();
	};

	return (
		<Animated.View className={slots.action({ className })} style={style}>
			<Pressable
				accessibilityElementsHidden
				accessible={false}
				className={slots.actionLabel()}
				disabled={isDisabled}
				feedback="fade"
				importantForAccessibility="no-hide-descendants"
				onPress={handlePress}
			>
				<Text className={slots.actionLabelText({ className: labelClassName })} numberOfLines={1}>
					{label}
				</Text>
			</Pressable>
			<View className={slots.actionAnchor()}>
				<Pressable
					accessibilityLabel={label}
					accessibilityRole="button"
					className={slots.actionButton()}
					disabled={isDisabled}
					feedback="scale"
					haptic={haptic}
					onPress={handlePress}
					testID={testID}
				>
					<Icon
						className={slots.actionIcon()}
						color={isDestructive ? "destructive" : FAB_FOREGROUND_TOKEN.surface}
						icon={icon}
					/>
				</Pressable>
			</View>
		</Animated.View>
	);
}
FabAction.displayName = "DelacourUI.Fab.Action";
