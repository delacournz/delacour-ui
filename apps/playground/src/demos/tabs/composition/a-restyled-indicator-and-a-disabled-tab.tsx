import { Tabs } from "@delacour/native-ui/tabs";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A restyled indicator, and a disabled tab",
	note: "The capsule keeps its measured position and its spring; only its paint changed, and it changed through a `className` that merges after the variant's own fill. Children go *inside* the capsule rather than replacing it — `Radio.Indicator` keeps its ring the same way — so an outline is a class, not a child.\n\nA variant pairs its fill with a label colour that has to read against it, so emptying the capsule takes the label with it — `primary`'s selected label is `elevated-foreground`, the content colour for the surface the capsule is painted on. Against a transparent capsule that still reads here, but a fill and its foreground are one decision.\n\nThe disabled tab must actually look faded. At full contrast the fade landed on the pressable's own animated node, which overwrites opacity every frame.",
};

export function Demo(): ReactElement {
	return (
		<Tabs variant="primary">
			<Tabs.List>
				<Tabs.Indicator className="border border-primary bg-transparent" />
				<Tabs.Trigger testID="restyled-live" value="live">
					Live
				</Tabs.Trigger>
				<Tabs.Trigger testID="restyled-draft" value="draft">
					Draft
				</Tabs.Trigger>
				<Tabs.Trigger isDisabled testID="restyled-archived" value="archived">
					Archived
				</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="live">
				<View className="h-20 justify-center rounded-lg bg-secondary px-4">
					<Text.Paragraph>Live.</Text.Paragraph>
				</View>
			</Tabs.Content>
			<Tabs.Content value="draft">
				<View className="h-20 justify-center rounded-lg bg-secondary px-4">
					<Text.Paragraph>Draft.</Text.Paragraph>
				</View>
			</Tabs.Content>
			<Tabs.Content value="archived">
				<View className="h-20 justify-center rounded-lg bg-secondary px-4">
					<Text.Paragraph>Archived.</Text.Paragraph>
				</View>
			</Tabs.Content>
		</Tabs>
	);
}
