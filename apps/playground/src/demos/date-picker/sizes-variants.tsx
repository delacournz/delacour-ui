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
	align: "stretch",
};

const DAY: CalendarDate = { year: 2026, month: 10, day: 14 };

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<View className="flex-row gap-2">
				<Input className="flex-1" placeholder="Name" size="sm" />
				<DatePicker className="flex-1" defaultValue={DAY} size="sm" />
			</View>
			<View className="flex-row gap-2">
				<Input className="flex-1" placeholder="Name" />
				<DatePicker className="flex-1" defaultValue={DAY} />
			</View>
			<View className="flex-row gap-2">
				<Input className="flex-1" placeholder="Name" size="lg" />
				<DatePicker className="flex-1" defaultValue={DAY} size="lg" />
			</View>
			<DatePicker variant="secondary" />
		</View>
	);
}
