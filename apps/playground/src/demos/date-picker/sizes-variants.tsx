import type { CalendarDate } from "@delacour/react-native-ui/calendar";
import { DatePicker } from "@delacour/react-native-ui/date-picker";
import { Input } from "@delacour/react-native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes and variants",
	caption:
		"The trigger is the `Input` box — the same `size` and `variant` axes, read from the same slot — so a picker beside a text field lines up with it exactly. The calendar inside keeps its own `calendarSize`, so day targets never shrink with the field.",
	capture: { align: "stretch" },
};

const DAY: CalendarDate = { year: 2026, month: 10, day: 14 };

/**
 * Each `Input` sits in a `flex-1` box of its own rather than taking `flex-1` itself: a `TextInput`
 * carries its padding on the flex item, the picker carries it one level in, and two `flex-1` items
 * with different padding split a row unevenly.
 */
export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<View className="flex-row gap-2">
				<View className="flex-1">
					<Input placeholder="Name" size="sm" />
				</View>
				<DatePicker className="flex-1" defaultValue={DAY} size="sm" />
			</View>
			<View className="flex-row gap-2">
				<View className="flex-1">
					<Input placeholder="Name" />
				</View>
				<DatePicker className="flex-1" defaultValue={DAY} />
			</View>
			<View className="flex-row gap-2">
				<View className="flex-1">
					<Input placeholder="Name" size="lg" />
				</View>
				<DatePicker className="flex-1" defaultValue={DAY} size="lg" />
			</View>
			<DatePicker variant="secondary" />
		</View>
	);
}
