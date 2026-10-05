import { Countdown } from "@delacour/react-native-ui/countdown";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Labels",
	align: "center",
	caption:
		"`labels` replaces the captions under the boxes, and names the units a screen reader hears — localise them with the rest of the screen.",
};

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000;

export function Demo(): ReactElement {
	const [endsAt] = useState(() => Date.now() + THREE_DAYS);
	return <Countdown labels={{ days: "Tage", hours: "Std.", minutes: "Min.", seconds: "Sek." }} size="sm" to={endsAt} />;
}
