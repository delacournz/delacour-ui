import { COUNTDOWN_SIZES, Countdown, type CountdownSize } from "@delacour/react-native-ui/countdown";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	align: "center",
	note: "The size steps the digits up the type scale — header, title, display — and the box padding with them.",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<CountdownSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	const [endsAt] = useState(() => Date.now() + (5 * 60 * 60 + 42 * 60) * 1000);
	return (
		<View className="items-center gap-6">
			{COUNTDOWN_SIZES.map((size) => (
				<View className="items-center gap-2" key={size}>
					<Text.Caption>{LABELS[size]}</Text.Caption>
					<Countdown size={size} to={endsAt} units={["hours", "minutes", "seconds"]} />
				</View>
			))}
		</View>
	);
}
