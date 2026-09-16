import { Tabs } from "@delacour/native-ui/tabs";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Separators",
	note: "Every rule is present at rest. Drag sideways and the one the capsule is crossing dips out and comes back — it reads the pager's position, not the settled value, so it fades under the finger and returns if the drag is abandoned. The fade means one thing: the indicator is on top of this rule right now.\n\nA faded rule still takes its width, so the row never reflows while the fade runs. That does make a bar wider — enough to tip a row that only just fits into one that scrolls, at which point `scrollAlign` starts moving it for no reason a reader can see. This one has room, so it takes no `Tabs.ScrollView`.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<Tabs variant="secondary">
			<Tabs.List>
				<Tabs.Indicator />
				<Tabs.Trigger testID="sep-overview" value="overview">
					Overview
				</Tabs.Trigger>
				<Tabs.Separator betweenValues={["overview", "activity"]} />
				<Tabs.Trigger testID="sep-activity" value="activity">
					Activity
				</Tabs.Trigger>
				<Tabs.Separator betweenValues={["activity", "settings"]} />
				<Tabs.Trigger testID="sep-settings" value="settings">
					Settings
				</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="overview">
				<View className="h-20 justify-center rounded-lg bg-secondary px-4">
					<Text.Paragraph>Everything at a glance.</Text.Paragraph>
				</View>
			</Tabs.Content>
			<Tabs.Content value="activity">
				<View className="h-20 justify-center rounded-lg bg-secondary px-4">
					<Text.Paragraph>What changed, and when.</Text.Paragraph>
				</View>
			</Tabs.Content>
			<Tabs.Content value="settings">
				<View className="h-20 justify-center rounded-lg bg-secondary px-4">
					<Text.Paragraph>Nothing here is saved.</Text.Paragraph>
				</View>
			</Tabs.Content>
		</Tabs>
	);
}
