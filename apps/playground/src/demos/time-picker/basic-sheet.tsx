import { TimePicker, type TimeValue } from "@delacour/react-native-ui/time-picker";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a sheet",
	caption:
		"The trigger is an `Input`'s box. Pressing it opens a bottom sheet of wheels, and the value changes each time a wheel comes to rest.",
	align: "stretch",
	capture: { flow: true, frame: "device", hero: true },
};

/**
 * Fills and centres because it is captured as a whole screen — the sheet is a
 * portal — and a trigger left at the top would sit under the Dynamic Island.
 */
export function Demo(): ReactElement {
	const [time, setTime] = useState<TimeValue | null>({ hour: 12, minute: 0 });

	return (
		<View className="flex-1 justify-center px-screen-gutter">
			<TimePicker onValueChange={setTime} testID="time-picker-basic" value={time} />
		</View>
	);
}
