import {
	DateTimePicker,
	type DateTimeValue,
	fromNativeDate,
	toNativeDate,
} from "@delacour/react-native-ui/date-time-picker";
import { type ReactElement, useMemo, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "From now, for two weeks",
	caption:
		"`minDateTime` and `maxDateTime` are one window. They bound the calendar to their days and the wheel to their times on those days only — so today starts at the current time, tomorrow at midnight. Weekends are disabled too; move the date onto today and an earlier time is pulled up.",
	align: "stretch",
};

const FORTNIGHT_MS = 14 * 24 * 60 * 60 * 1000;

export function Demo(): ReactElement {
	const [when, setWhen] = useState<DateTimeValue | null>(null);
	const bounds = useMemo(() => {
		const now = fromNativeDate(new Date());
		return { max: fromNativeDate(new Date(toNativeDate(now).getTime() + FORTNIGHT_MS)), min: now };
	}, []);

	return (
		<DateTimePicker
			accessibilityLabel="Delivery slot"
			disabledDates={[{ days: [0, 6], type: "weekday" }]}
			maxDateTime={bounds.max}
			minDateTime={bounds.min}
			minuteStep={30}
			onValueChange={setWhen}
			testID="date-time-picker-bounds"
			title="Delivery slot"
			value={when}
		/>
	);
}
