import { Countdown } from "@delacour/react-native-ui/countdown";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Units",
	caption:
		"Pick the units to show. The largest absorbs everything above it, so hours and minutes read 51 hours for two days and three hours — and the smallest rounds up, so it never reads zero before time is up.",
	align: "center",
	capture: {},
};

const TWO_DAYS_THREE_HOURS = (2 * 24 + 3) * 60 * 60 * 1000;

export function Demo(): ReactElement {
	const [endsAt] = useState(() => Date.now() + TWO_DAYS_THREE_HOURS);
	return <Countdown to={endsAt} units={["hours", "minutes"]} />;
}
