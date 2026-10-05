import { TimePicker, type TimeValue } from "@delacour/react-native-ui/time-picker";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With seconds",
	caption: "`showSeconds` adds a third wheel, and the value carries a `second` field.",
	align: "stretch",
};

export function Demo(): ReactElement {
	const [time, setTime] = useState<TimeValue | null>({ hour: 0, minute: 2, second: 30 });

	return <TimePicker hourCycle={24} onValueChange={setTime} presentation="inline" showSeconds value={time} />;
}
