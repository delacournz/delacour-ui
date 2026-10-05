import { DateTimePicker, type DateTimeValue } from "@delacour/react-native-ui/date-time-picker";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Tabs",
	caption:
		"The default layout: Date and Time behind two tabs in one sheet, so it fits the shortest phone. Pick a day on an empty field and the sheet moves to Time once — the time it shows was only a guess from the clock. Every pick commits; Done closes.",
	align: "stretch",
};

export function Demo(): ReactElement {
	const [when, setWhen] = useState<DateTimeValue | null>(null);

	return (
		<DateTimePicker
			accessibilityLabel="Appointment"
			minuteStep={5}
			onValueChange={setWhen}
			testID="date-time-picker-tabs"
			title="Appointment"
			value={when}
		/>
	);
}
