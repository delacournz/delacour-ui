import type { ReactElement } from "react";
import type { LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { Icon, type IconComponent } from "../icon";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { useFabActionItem, useFabGroupPart } from "./fab.context";
import {
	FAB_DIAL_STAGGER,
	FAB_FOREGROUND_TOKEN,
	fabVariants,
	resolveActionMotion,
	resolveDialProgress,
} from "./fab.variants";

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
 * from the dial's one spring. It grows out of the trigger and collapses back
 * into it: the row travels down the centre line to the trigger's centre while
 * the button alone scales about its own centre, so nothing swings in from the
 * chip's side. Under reduced motion it fades in place.
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
	const { progress, triggerCenterY, count, labelSide, size, haptic, isReducedMotion, close } =
		useFabGroupPart("Fab.Action");
	const { index } = useFabActionItem("Fab.Action");
	const slots = fabVariants({ size, labelSide, isDisabled });
	const rowY = useSharedValue(0);
	const anchorCenterY = useSharedValue(0);

	const handleRowLayout = (event: LayoutChangeEvent) => {
		rowY.value = event.nativeEvent.layout.y;
	};
	const handleAnchorLayout = (event: LayoutChangeEvent) => {
		const { y, height } = event.nativeEvent.layout;
		anchorCenterY.value = y + height / 2;
	};

	const rowStyle = useAnimatedStyle(() => {
		if (isReducedMotion) {
			const value = progress.value;
			return { opacity: value < 0 ? 0 : value > 1 ? 1 : value, transform: [{ translateY: 0 }] };
		}
		const local = resolveDialProgress({ open: progress.value, index, count, stagger: FAB_DIAL_STAGGER });
		const measured = triggerCenterY.value > 0 && anchorCenterY.value > 0;
		const travel = measured ? triggerCenterY.value - (rowY.value + anchorCenterY.value) : 0;
		const motion = resolveActionMotion({ local, travel });
		return { opacity: motion.opacity, transform: [{ translateY: motion.translateY }] };
	});

	const anchorStyle = useAnimatedStyle(() => {
		if (isReducedMotion) return { transform: [{ scale: 1 }] };
		const local = resolveDialProgress({ open: progress.value, index, count, stagger: FAB_DIAL_STAGGER });
		return { transform: [{ scale: resolveActionMotion({ local, travel: 0 }).scale }] };
	});

	const handlePress = () => {
		onPress();
		close();
	};

	return (
		<Animated.View className={slots.action({ className })} onLayout={handleRowLayout} style={rowStyle}>
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
			<Animated.View className={slots.actionAnchor()} onLayout={handleAnchorLayout} style={anchorStyle}>
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
			</Animated.View>
		</Animated.View>
	);
}
FabAction.displayName = "DelacourUI.Fab.Action";
