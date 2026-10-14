import { TimePicker, type TimeValue } from "@delacour/react-native-ui/time-picker";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Quarter hours",
	caption:
		"`minuteStep={15}` leaves four rows on the minute wheel. A value off the step is rounded to it, not refused.",
	align: "stretch",
};

export function Demo(): ReactElement {
	const [time, setTime] = useState<TimeValue | null>(null);

	return (
		<TimePicker
			minuteStep={15}
			onValueChange={setTime}
			placeholder="Pick a slot"
			testID="time-picker-step"
			value={time}
		/>
	);
}
