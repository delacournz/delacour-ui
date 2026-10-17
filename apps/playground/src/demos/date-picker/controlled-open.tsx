import { Button } from "@delacour/react-native-ui/button";
import type { CalendarDate } from "@delacour/react-native-ui/calendar";
import { DatePicker } from "@delacour/react-native-ui/date-picker";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled open",
	caption:
		"`isOpen` and `onOpenChange` hand the sheet to the caller — here a button opens it, and the trigger and the button stay in step. Read-only shows the value and never opens.",
	align: "stretch",
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);
	const [day, setDay] = useState<CalendarDate | null>(null);

	return (
		<View className="gap-3">
			<DatePicker
				isOpen={isOpen}
				onOpenChange={setOpen}
				onValueChange={setDay}
				testID="date-picker-controlled"
				today={TODAY}
				value={day}
			/>
			<Button onPress={() => setOpen(true)} variant="secondary">
				<Button.Label>Pick a date</Button.Label>
			</Button>
			<Text.Caption color="muted">{isOpen ? "Sheet open" : "Sheet closed"}</Text.Caption>
			<DatePicker defaultValue={TODAY} isReadOnly />
		</View>
	);
}
