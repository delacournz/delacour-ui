import { Tabs } from "delacour-react-native-ui/tabs";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Swipeable — the default",
	note: "Drag slowly: the capsule tracks the finger rather than snapping at release. Let go before the halfway point and it returns. Flick hard across two panels and it still lands exactly one away — a flick is an instruction, not a licence to skip. Drag past the last panel and it resists rather than stopping dead.",
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

/**
 * The gesture, at its default.
 *
 * The gallery this sits in is a `Screen.ScrollArea`, which is the point: a
 * horizontal pan and a vertical scroll share the page and neither steals the
 * other's drag.
 */
export function Demo(): ReactElement {
	return (
		<Tabs>
			<Tabs.List>
				<Tabs.Indicator />
				{PANELS.map((panel) => (
					<Tabs.Trigger key={panel.value} testID={`swipeable-${panel.value}`} value={panel.value}>
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
