import { Countdown } from "@delacour/react-native-ui/countdown";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Segmented",
	align: "center",
	caption:
		"Each unit in its own box with its caption beneath. A changed digit slides in from above; an unchanged one never moves.",
};

const TWO_DAYS_THREE_HOURS = (2 * 24 + 3) * 60 * 60 * 1000;

export function Demo(): ReactElement {
	const [endsAt] = useState(() => Date.now() + TWO_DAYS_THREE_HOURS);
	return <Countdown testID="countdown-segmented" to={endsAt} />;
}
