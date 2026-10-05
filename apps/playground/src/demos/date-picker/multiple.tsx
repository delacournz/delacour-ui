import type { CalendarDate } from "@delacour/react-native-ui/calendar";
import { DatePicker } from "@delacour/react-native-ui/date-picker";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Several days",
	caption: '`mode="multiple"` reports every toggle and stays open until Done. The trigger lists two days, then counts.',
	align: "stretch",
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [days, setDays] = useState<readonly CalendarDate[]>([
		{ year: 2026, month: 10, day: 7 },
		{ year: 2026, month: 10, day: 9 },
	]);

	return (
		<DatePicker
			accessibilityLabel="Shifts"
			mode="multiple"
			onValueChange={setDays}
			testID="date-picker-multiple"
			title="Shifts"
			today={TODAY}
			value={days}
		/>
	);
}
