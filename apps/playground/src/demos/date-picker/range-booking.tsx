import type { CalendarDate, CalendarDateRange } from "@delacour/react-native-ui/calendar";
import { DatePicker } from "@delacour/react-native-ui/date-picker";
import { Field } from "@delacour/react-native-ui/field";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Range",
	caption:
		'`mode="range"` holds the first tap inside the sheet — the trigger shows "12 Oct 2026 –" behind it — and closes once both ends exist. `onValueChange` only ever sees a complete range, or an empty one from Clear.',
	align: "stretch",
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [stay, setStay] = useState<CalendarDateRange>({ start: null, end: null });

	return (
		<Field>
			<Field.Label>Check in / out</Field.Label>
			<DatePicker
				minDate={TODAY}
				mode="range"
				onValueChange={setStay}
				placeholder="Check in – check out"
				testID="date-picker-range"
				title="Your stay"
				today={TODAY}
				value={stay}
			/>
		</Field>
	);
}
