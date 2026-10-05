import type { CalendarDate, CalendarDateRange } from "@delacour/react-native-ui/calendar";
import { DatePicker } from "@delacour/react-native-ui/date-picker";
import { Field } from "@delacour/react-native-ui/field";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Range",
	caption:
		'`mode="range"` holds the first tap inside the sheet — the trigger shows "12 Oct 2026 –" behind it — and closes once both ends exist. `onValueChange` only ever sees a complete range, or an empty one from Clear.',
	align: "stretch",
	capture: { flow: "date-picker/range-booking", frame: "device" },
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [stay, setStay] = useState<CalendarDateRange>({ start: null, end: null });

	// Captured as a whole screen, so the field sits in the upper third, above the open sheet.
	return (
		<View className="flex-1 px-screen-gutter pt-32">
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
		</View>
	);
}
