import { TimePicker, type TimeValue } from "@delacour/react-native-ui/time-picker";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "12 and 24 hours",
	caption:
		"The same stored value, `{ hour: 18, minute: 45 }`, on a 12-hour and a 24-hour clock. The hour cycle changes how it reads, never what is stored.",
	align: "stretch",
};

export function Demo(): ReactElement {
	const [time, setTime] = useState<TimeValue | null>({ hour: 18, minute: 45 });

	return (
		<View className="gap-3">
			<TimePicker hourCycle={12} locale="en-US" onValueChange={setTime} value={time} />
			<TimePicker hourCycle={24} locale="en-GB" onValueChange={setTime} value={time} />
		</View>
	);
}
