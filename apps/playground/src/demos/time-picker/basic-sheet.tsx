import { TimePicker, type TimeValue } from "@delacour/react-native-ui/time-picker";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a sheet",
	caption:
		"The trigger is an `Input`'s box. Pressing it opens a bottom sheet of wheels, and the value changes each time a wheel comes to rest.",
	align: "stretch",
};

export function Demo(): ReactElement {
	const [time, setTime] = useState<TimeValue | null>({ hour: 9, minute: 30 });

	return <TimePicker onValueChange={setTime} testID="time-picker-basic" value={time} />;
}
