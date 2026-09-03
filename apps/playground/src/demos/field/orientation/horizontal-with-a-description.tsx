import { Checkbox } from "delacour-react-native-ui/checkbox";
import { Field } from "delacour-react-native-ui/field";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Horizontal, with a description",
	caption:
		"`Field.Content` bundles the label and its description into one block, so the row lays out as text-then-control rather than three things in a line. Without it the description would become a third column.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field orientation="horizontal">
				<Field.Content>
					<Field.Label>Sync across devices</Field.Label>
					<Field.Description>Your drafts follow you to every device you sign in on.</Field.Description>
				</Field.Content>
				<Checkbox color="primary" defaultChecked testID="sync" />
			</Field>
			<Field orientation="horizontal">
				<Field.Content>
					<Field.Label>Delete after 30 days</Field.Label>
					<Field.Description>Applies to items in the archive only.</Field.Description>
				</Field.Content>
				<Checkbox color="primary" testID="delete-after-30-days" />
			</Field>
		</View>
	);
}
