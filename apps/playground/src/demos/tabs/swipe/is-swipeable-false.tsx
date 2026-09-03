import { Tabs } from "delacour-react-native-ui/tabs";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "isSwipeable={false}",
	note: "One `.enabled(false)` on the pan, and nothing else in the component branches on it. Presses animate exactly as they do above, and every panel is still mounted — you cannot drag to a panel that is not there, so mounting is not something this prop gets to change as a side effect.",
};

const PANELS = [
	{ tone: "bg-success-soft", value: "one" },
	{ tone: "bg-warning-soft", value: "two" },
	{ tone: "bg-info-soft", value: "three" },
] as const;

function Panel({ label, tone }: { label: string; tone: string }): ReactElement {
	return (
		<View className={`h-28 items-center justify-center rounded-lg ${tone}`}>
			<Text.Header>{label}</Text.Header>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<Tabs isSwipeable={false} variant="secondary">
			<Tabs.List>
				<Tabs.Indicator />
				{PANELS.map((panel) => (
					<Tabs.Trigger key={panel.value} testID={`fixed-${panel.value}`} value={panel.value}>
						{panel.value}
					</Tabs.Trigger>
				))}
			</Tabs.List>
			{PANELS.map((panel) => (
				<Tabs.Content key={panel.value} value={panel.value}>
					<Panel label={panel.value} tone={panel.tone} />
				</Tabs.Content>
			))}
		</Tabs>
	);
}
