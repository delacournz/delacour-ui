import { TimePicker, type TimeValue } from "@delacour/react-native-ui/time-picker";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Opening hours",
	caption:
		"`minTime` and `maxTime` dim every row outside 9:00 to 17:30. A wheel that comes to rest on one moves back to the nearest time that can be picked.",
	align: "stretch",
};

const OPENS: TimeValue = { hour: 9, minute: 0 };
const CLOSES: TimeValue = { hour: 17, minute: 30 };

export function Demo(): ReactElement {
	const [time, setTime] = useState<TimeValue | null>({ hour: 12, minute: 0 });

	return (
		<TimePicker
			maxTime={CLOSES}
			minTime={OPENS}
			minuteStep={5}
			onValueChange={setTime}
			presentation="inline"
			testID="time-picker-bounds"
			value={time}
		/>
	);
}
