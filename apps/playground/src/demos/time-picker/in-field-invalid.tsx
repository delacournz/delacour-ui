import { Field } from "@delacour/react-native-ui/field";
import { TimePicker, type TimeValue } from "@delacour/react-native-ui/time-picker";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a field",
	caption:
		"Inside a `Field` the picker takes the field's invalid state, reads the label as its accessible name, and opens when the label is tapped.",
	align: "stretch",
	capture: { flow: "time-picker/in-field-invalid", frame: "device" },
};

/** Fills and centres for the whole-screen capture, which the sheet's portal needs. */
export function Demo(): ReactElement {
	const [time, setTime] = useState<TimeValue | null>(null);

	return (
		<View className="flex-1 justify-center px-screen-gutter">
			<Field isInvalid={time === null}>
				<Field.Label>Reminder</Field.Label>
				<TimePicker clearable minuteStep={5} onValueChange={setTime} value={time}>
					<TimePicker.Trigger testID="time-picker-field">
						<TimePicker.Value placeholder="Choose a reminder time" />
						<TimePicker.Icon />
					</TimePicker.Trigger>
					<TimePicker.Content title="Reminder time">
						<TimePicker.Wheel />
					</TimePicker.Content>
				</TimePicker>
				<Field.Error>{time === null ? "Pick a time for the reminder." : undefined}</Field.Error>
			</Field>
		</View>
	);
}
