import { Countdown } from "@delacour/react-native-ui/countdown";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Urgent",
	align: "center",
	caption:
		"`urgentBelow` takes seconds. At or below it the digits turn destructive — here, the last minute of a booking hold.",
};

export function Demo(): ReactElement {
	const [endsAt] = useState(() => Date.now() + 75 * 1000);
	return <Countdown testID="countdown-urgent" to={endsAt} urgentBelow={60} />;
}
