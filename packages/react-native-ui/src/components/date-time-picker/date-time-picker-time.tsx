import { type ReactElement, useCallback, useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { Pressable } from "../pressable";
import { Separator } from "../separator";
import { Text } from "../text";
import { TimePickerWheel } from "../time-picker";
import { useDateTimePickerPart } from "./date-time-picker.context";
import {
	DATE_TIME_PICKER_WHEEL_HEIGHT,
	dateTimePickerVariants,
	resolveExpandDuration,
} from "./date-time-picker.variants";

export type DateTimePickerTimeProps = {
	className?: string;
	testID?: string;
};

/** The wheel itself, bound to the picker — `md`, on the chosen day's bounds, committing every settle. */
function DateTimePickerWheel({ testID }: { testID?: string }): ReactElement {
	const picker = useDateTimePickerPart("DateTimePicker.Time");

	return (
		<View pointerEvents={picker.isReadOnly ? "none" : "auto"}>
			<TimePickerWheel
				hourCycle={picker.hourCycle}
				isDisabled={picker.isDisabled}
				locale={picker.locale}
				maxTime={picker.timeBoundsForDate.maxTime}
				minTime={picker.timeBoundsForDate.minTime}
				minuteStep={picker.wheel.minuteStep}
				onValueChange={picker.setTime}
				showSeconds={picker.wheel.showSeconds}
				size="md"
				testID={testID}
				value={picker.value?.time ?? null}
			/>
		</View>
	);
}
DateTimePickerWheel.displayName = "DelacourUI.DateTimePicker.Time.Wheel";

/**
 * The stacked layout's time row and the wheel it opens beneath it.
 *
 * **The height is committed by React, not animated on the UI thread.** The sheet sizes itself from
 * its content's measured layout, and a height written by a Reanimated style never reaches that
 * measurement — the wheel opened behind the footer while the sheet stayed where it was. So the
 * clip's height is a plain style, known up front (`DATE_TIME_PICKER_WHEEL_HEIGHT`), and the motion
 * is the sheet's own spring to its new snap point plus a fade on the wheel; under calm motion the
 * fade is skipped. Closed, the wheel stays mounted — its scroll position survives — but takes no
 * height, leaves the accessibility tree and stops taking touches.
 */
function DateTimePickerStackedTime({ className, testID }: DateTimePickerTimeProps): ReactElement {
	const picker = useDateTimePickerPart("DateTimePicker.Time");
	const isCalm = useCalmMotion();
	const { isTimeExpanded, setTimeExpanded } = picker;
	const slots = dateTimePickerVariants({
		isExpanded: isTimeExpanded,
		isPlaceholder: picker.value === null,
		layout: "stacked",
	});

	const opacity = useSharedValue(isTimeExpanded ? 1 : 0);
	useEffect(() => {
		const target = isTimeExpanded ? 1 : 0;
		const duration = resolveExpandDuration(isCalm);
		opacity.value = duration === 0 ? target : withTiming(target, { duration });
	}, [isCalm, isTimeExpanded, opacity]);

	const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

	const toggle = useCallback(() => setTimeExpanded(!isTimeExpanded), [isTimeExpanded, setTimeExpanded]);
	const isInert = picker.isDisabled || picker.isReadOnly;

	return (
		<View className={className}>
			<Separator className={slots.divider()} />
			<Pressable
				accessibilityHint={isTimeExpanded ? "Hides the time wheel" : "Shows the time wheel"}
				accessibilityLabel={picker.timeLabel}
				accessibilityRole="button"
				accessibilityState={{ disabled: isInert, expanded: isTimeExpanded }}
				accessibilityValue={{ text: picker.value ? picker.timeReadout : "not set" }}
				className={slots.timeRow()}
				disabled={isInert}
				feedback="fade"
				onPress={toggle}
			>
				<Text className={slots.timeLabel()}>{picker.timeLabel}</Text>
				<Text className={slots.timeValue()}>{picker.timeReadout}</Text>
			</Pressable>
			<View
				accessibilityElementsHidden={!isTimeExpanded}
				className={slots.timeWheel()}
				importantForAccessibility={isTimeExpanded ? "auto" : "no-hide-descendants"}
				pointerEvents={isTimeExpanded ? "auto" : "none"}
				style={{ height: isTimeExpanded ? DATE_TIME_PICKER_WHEEL_HEIGHT : 0 }}
			>
				<Animated.View style={fadeStyle}>
					<DateTimePickerWheel testID={testID} />
				</Animated.View>
			</View>
		</View>
	);
}
DateTimePickerStackedTime.displayName = "DelacourUI.DateTimePicker.Time.Stacked";

/**
 * The time half: `TimePicker`'s wheel, bound to the picker, under a readout row.
 *
 * In the `tabs` layout it is the Time panel — "Time  3:30 PM" over the wheel, both always shown.
 * In the `stacked` layout it is a hairline, then that row as a button that opens the wheel beneath
 * it, so a calendar and a wheel are not both on screen until the time is wanted.
 *
 * The wheel takes the chosen day's bounds — only the window's first and last days bound the clock
 * — and every settle goes to `setTime`, which completes an empty value on today.
 */
export function DateTimePickerTime({ className, testID }: DateTimePickerTimeProps): ReactElement {
	const picker = useDateTimePickerPart("DateTimePicker.Time");
	const slots = dateTimePickerVariants({ isPlaceholder: picker.value === null, layout: picker.layout });

	if (picker.layout === "stacked") return <DateTimePickerStackedTime className={className} testID={testID} />;

	return (
		<View className={slots.panel({ className })}>
			<View
				accessibilityLabel={`${picker.timeLabel}, ${picker.value ? picker.timeReadout : "not set"}`}
				accessible
				className={slots.timeRow()}
			>
				<Text className={slots.timeLabel()}>{picker.timeLabel}</Text>
				<Text className={slots.timeValue()}>{picker.timeReadout}</Text>
			</View>
			<DateTimePickerWheel testID={testID} />
		</View>
	);
}
DateTimePickerTime.displayName = "DelacourUI.DateTimePicker.Time";
