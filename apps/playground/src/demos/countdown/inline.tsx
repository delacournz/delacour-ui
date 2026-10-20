import { Countdown } from "@delacour/react-native-ui/countdown";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inline",
	caption:
		"One run of tabular digits — `2d 14:03:22`, `14:03:22`, `3:22` — for a row or a banner. Days lead with a suffix; every unit after the first is padded.",
	capture: { flow: true, settleMs: 150, align: "stretch" },
};

const HOUR = 60 * 60 * 1000;

export function Demo(): ReactElement {
	const [saleEndsAt] = useState(() => Date.now() + 2 * 24 * HOUR + 14 * HOUR + 3 * 60 * 1000);
	const [holdEndsAt] = useState(() => Date.now() + 9 * 60 * 1000 + 41 * 1000);
	return (
		<View className="gap-4">
			<View className="flex-row items-center justify-between gap-4">
				<Text.Label>Sale ends in</Text.Label>
				<Countdown size="sm" to={saleEndsAt} variant="inline" />
			</View>
			<View className="flex-row items-center justify-between gap-4">
				<Text.Label>Seats held for</Text.Label>
				<Countdown size="sm" to={holdEndsAt} variant="inline" />
			</View>
		</View>
	);
}
