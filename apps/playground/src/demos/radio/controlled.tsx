import { Radio } from "@delacour/native-ui/radio";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	note: "`selected` takes `plan ?? null`. Passing a bare `undefined` would read as uncontrolled, so the group would hold its own state and then switch modes on the first press.",
};

const PLANS = ["free", "pro", "team"] as const;

export function Demo(): ReactElement {
	const [plan, setPlan] = useState<string>();

	return (
		<View className="gap-3">
			<Radio.Group accessibilityLabel="Plan" onSelected={setPlan} selected={plan ?? null}>
				{PLANS.map((name) => (
					<Radio key={name} testID={`radio-${name}`} value={name}>
						{name}
					</Radio>
				))}
			</Radio.Group>
			<Text.Caption>{plan ? `Plan: ${plan}` : "No plan selected"}</Text.Caption>
		</View>
	);
}
