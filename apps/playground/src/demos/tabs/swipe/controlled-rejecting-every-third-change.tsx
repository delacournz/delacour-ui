import { Tabs } from "@delacour/native-ui/tabs";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useCallback, useRef, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled, rejecting every third change",
	note: "Every third press or swipe is refused. A refused press must not animate at all; a refused swipe has to spring back, because the finger already moved the pager. An accepted swipe keeps the momentum it was thrown with, which is the case that breaks if the reconcile is not told where the gesture already aimed.",
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
	const [rejected, setRejected] = useState("one");
	const attempts = useRef(0);

	// Accepts two changes in three. A controlled parent that ignores a change
	// re-renders nothing, so this is the case a reconcile keyed only on the
	// parent's commit would never run for — the pager would sit on a panel the
	// caller's state says is not selected.
	const handleRejecting = useCallback((next: string) => {
		attempts.current += 1;
		if (attempts.current % 3 === 0) return;
		setRejected(next);
	}, []);

	return (
		<Tabs onValueChange={handleRejecting} value={rejected}>
			<Tabs.List>
				<Tabs.Indicator />
				{PANELS.map((panel) => (
					<Tabs.Trigger key={panel.value} testID={`rejecting-${panel.value}`} value={panel.value}>
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
