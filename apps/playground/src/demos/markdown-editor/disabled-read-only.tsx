import { Field } from "@delacour/react-native-ui/field";
import { MarkdownEditor } from "@delacour/react-native-ui/markdown-editor";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled and read-only",
	caption:
		"Disabled blocks the text, the toolbar and the mode switch. Read-only keeps the text selectable and the switch working, and turns formatting off.",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field isDisabled>
				<Field.Label>Disabled</Field.Label>
				<MarkdownEditor defaultValue="Locked while the **release** ships." rows={3} testID="disabled" />
			</Field>
			<Field>
				<Field.Label>Read-only</Field.Label>
				<MarkdownEditor defaultValue="Signed off by _the editor_." isReadOnly rows={3} testID="read-only" />
			</Field>
		</View>
	);
}
