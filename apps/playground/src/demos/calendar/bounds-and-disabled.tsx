import { Calendar, type CalendarDate, type DateMatcher } from "@delacour/react-native-ui/calendar";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Bounds and disabled days",
	caption:
		"`minDate` and `maxDate` bound what can be picked, and the arrows stop at their months. `disabled` takes further matchers — here every weekend and one public holiday. A range can never be completed across a disabled day.",
	capture: { align: "stretch" },
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

const CLOSED: readonly DateMatcher[] = [
	{ type: "weekday", days: [0, 6] },
	{ type: "date", date: { year: 2026, month: 10, day: 26 } },
];

export function Demo(): ReactElement {
	return (
		<Calendar
			disabled={CLOSED}
			maxDate={{ year: 2026, month: 11, day: 30 }}
			minDate={TODAY}
			testID="calendar-bounds"
			today={TODAY}
		/>
	);
}
