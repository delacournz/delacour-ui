import { Text } from "@delacour/react-native-ui/text";
import { formatTime, TimePicker, type TimeValue } from "@delacour/react-native-ui/time-picker";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inline",
	caption: '`presentation="inline"` draws the bare wheel in place, with no trigger and no sheet.',
	align: "stretch",
};

export function Demo(): ReactElement {
	const [time, setTime] = useState<TimeValue | null>({ hour: 7, minute: 15 });

	return (
		<View className="gap-3">
			<TimePicker onValueChange={setTime} presentation="inline" value={time} />
			<Text.Caption className="text-center">
				{time ? formatTime(time, { locale: "en-US", hourCycle: 12 }) : "Not set"}
			</Text.Caption>
		</View>
	);
}
