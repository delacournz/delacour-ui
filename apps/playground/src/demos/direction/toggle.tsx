import { Direction, type DirectionValue } from "@delacour/react-native-ui/direction";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Toggle at runtime",
	caption:
		"`dir` is an ordinary prop. Flip it and the card relayouts on the next frame — no remount, no restart, which is what `I18nManager.forceRTL` would need. The step numbers sit in their own left-to-right `Direction`, so their order holds.",
	capture: { align: "stretch", flow: true, hero: true },
};

const LABELS: Record<DirectionValue, string> = {
	ltr: "Left to right",
	rtl: "Right to left",
};

const STEPS = ["One", "Two", "Three"] as const;

export function Demo(): ReactElement {
	const [dir, setDir] = useState<DirectionValue>("ltr");

	return (
		<View className="gap-4">
			<View className="flex-row items-center justify-between">
				<Text.Label>{LABELS[dir]}</Text.Label>
				<Switch
					accessibilityLabel="Right to left"
					isSelected={dir === "rtl"}
					onSelectedChange={(isRTL) => setDir(isRTL ? "rtl" : "ltr")}
					testID="dir-toggle"
				/>
			</View>
			<Direction dir={dir}>
				<View className="gap-4 rounded-lg border border-border bg-card p-4">
					<View className="flex-row gap-2">
						{STEPS.map((step) => (
							<View
								className="flex-1 rounded-md bg-muted px-3 py-2"
								key={step}
								testID={`dir-step-${step.toLowerCase()}`}
							>
								<Text.Label className="text-left">{step}</Text.Label>
							</View>
						))}
					</View>
					<Direction dir="ltr">
						<View className="flex-row gap-2" testID="dir-fixed">
							{STEPS.map((step, index) => (
								<View
									className="flex-1 rounded-md border border-border px-3 py-2"
									key={step}
									testID={`dir-fixed-${index + 1}`}
								>
									<Text.Code>{index + 1}</Text.Code>
								</View>
							))}
						</View>
					</Direction>
				</View>
			</Direction>
		</View>
	);
}
