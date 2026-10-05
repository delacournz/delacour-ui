import { type ReactElement, useEffect } from "react";
import { View } from "react-native";
import Animated, {
	cancelAnimation,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { IconCheckmark1Small } from "../../icons/central";
import { Icon } from "../icon";
import type { InputSize } from "../input/input.variants";
import { Pressable } from "../pressable";
import { Text } from "../text";
import type { SelectHighlightRange, SelectRowOption, SelectSelectionMode } from "./select.types";
import {
	SELECT_CHECK_TOKEN,
	SELECT_CHECKBOX_TICK_TOKEN,
	SELECT_INDICATOR_DURATION_MS,
	SELECT_INDICATOR_FROM_SCALE,
	selectVariants,
	splitHighlight,
} from "./select.variants";

export type SelectOptionRowProps = {
	option: SelectRowOption;
	isSelected: boolean;
	/** Radio semantics and a trailing check, or checkbox semantics and a trailing box. */
	mode: SelectSelectionMode;
	/** Faded and inert. The caller decides why — the option's own flag, or a selection limit. */
	isDisabled?: boolean;
	onPress: (value: string) => void;
	size?: InputSize;
	/** Runs of the label to emphasise — what a query matched. */
	highlight?: readonly SelectHighlightRange[];
	/** Replaces the option's own description — "Limit reached", say. */
	description?: string;
	testID?: string;
};

/** The glyph inside the multiple-mode box sits two steps below the box, as Checkbox's does. */
const CHECKBOX_GLYPH_SIZE: Record<InputSize, "xs" | "sm" | "md"> = { sm: "xs", md: "sm", lg: "md" };

/**
 * The trailing mark: a check in single mode, a box in multiple mode.
 *
 * It fades and grows in over 120ms. Under calm motion the growth is dropped and
 * the fade kept — the state change is the point, the scale is decoration.
 */
function SelectOptionIndicator({
	isSelected,
	mode,
	size,
}: {
	isSelected: boolean;
	mode: SelectSelectionMode;
	size: InputSize;
}): ReactElement {
	const isCalm = useCalmMotion();
	const progress = useSharedValue(isSelected ? 1 : 0);
	const slots = selectVariants({ isSelected, size });

	useEffect(() => {
		progress.value = withTiming(isSelected ? 1 : 0, { duration: SELECT_INDICATOR_DURATION_MS });
		return () => cancelAnimation(progress);
	}, [isSelected, progress]);

	const markStyle = useAnimatedStyle(() => ({
		opacity: progress.value,
		transform: [{ scale: isCalm ? 1 : interpolate(progress.value, [0, 1], [SELECT_INDICATOR_FROM_SCALE, 1]) }],
	}));

	// Single mode shows nothing on an unchosen row, so the mark is the whole
	// indicator; multiple mode always draws the box, and only the tick animates.
	if (mode === "single") {
		return (
			<Animated.View className={slots.rowIndicator()} style={markStyle}>
				<Icon color={SELECT_CHECK_TOKEN} icon={IconCheckmark1Small} size={size} />
			</Animated.View>
		);
	}

	return (
		<View className={slots.rowCheckbox()}>
			<Animated.View style={markStyle}>
				<Icon color={SELECT_CHECKBOX_TICK_TOKEN} icon={IconCheckmark1Small} size={CHECKBOX_GLYPH_SIZE[size]} />
			</Animated.View>
		</View>
	);
}
SelectOptionIndicator.displayName = "DelacourUI.Select.OptionIndicator";

/**
 * One option in the sheet: a leading glyph, the label and description, and a
 * trailing check or box.
 *
 * A pure presentational leaf — it reads no context, so `Combobox` draws the same
 * row from its own state, with `highlight` marking what the query matched.
 *
 * A screen reader hears a radio in single mode and a checkbox in multiple, with
 * the state that goes with each. A disabled row is announced as disabled and
 * ignores presses. Pressing plays the `selection` haptic.
 */
export function SelectOptionRow({
	option,
	isSelected,
	mode,
	isDisabled = false,
	onPress,
	size = "md",
	highlight,
	description,
	testID,
}: SelectOptionRowProps): ReactElement {
	const slots = selectVariants({ isDisabled, isSelected, size });
	const shownDescription = description ?? option.description;
	const segments = splitHighlight(option.label, highlight);
	const accessibilityLabel = shownDescription ? `${option.label}, ${shownDescription}` : option.label;

	const label = option.content ?? (
		<Text className={slots.rowLabel()} numberOfLines={2}>
			{segments.map((segment, index) =>
				segment.isHighlighted ? (
					<Text.Strong key={`${index}-${segment.text}`}>{segment.text}</Text.Strong>
				) : (
					segment.text
				)
			)}
		</Text>
	);

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole={mode === "single" ? "radio" : "checkbox"}
			accessibilityState={mode === "single" ? { selected: isSelected } : { checked: isSelected }}
			className={slots.row({ className: option.className })}
			disabled={isDisabled}
			feedback="fade"
			haptic="selection"
			onPress={() => onPress(option.value)}
			testID={testID}
		>
			{option.icon ? <Icon className={slots.rowIcon()} color="popover-foreground" icon={option.icon} /> : null}
			<View className={slots.rowContent()}>
				{label}
				{shownDescription ? <Text className={slots.rowDescription()}>{shownDescription}</Text> : null}
			</View>
			<SelectOptionIndicator isSelected={isSelected} mode={mode} size={size} />
		</Pressable>
	);
}
SelectOptionRow.displayName = "DelacourUI.Select.OptionRow";
