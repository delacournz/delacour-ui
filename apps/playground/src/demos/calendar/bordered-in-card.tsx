import { Calendar, type CalendarDate } from "@delacour/react-native-ui/calendar";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Bordered",
	caption:
		"`isBordered` draws the calendar on a `Surface` card. Off by default, because the calendar's commonest home is a sheet or a card that already has a frame of its own.",
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	return (
		<Calendar
			defaultSelected={{ year: 2026, month: 10, day: 22 }}
			isBordered
			testID="calendar-bordered"
			today={TODAY}
		/>
	);
}
