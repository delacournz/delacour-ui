import { Button } from "@delacour/react-native-ui/button";
import { Field } from "@delacour/react-native-ui/field";
import { Text } from "@delacour/react-native-ui/text";
import { Textarea } from "@delacour/react-native-ui/textarea";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled and uncontrolled",
	caption:
		"Controlled, `value` and `onChangeText` own the text, so a button can fill or clear it. Uncontrolled, `defaultValue` seeds it and the field keeps the rest — the count follows either.",
	keyboardAware: true,
};

const TEMPLATE = "Hi team,\n\nThanks for today. Notes attached.";

export function Demo(): ReactElement {
	const [notes, setNotes] = useState("");
	const lines = notes.split("\n").length;

	return (
		<View className="gap-6">
			<Field>
				<Field.Label>Controlled</Field.Label>
				<Textarea
					maxLength={120}
					onChangeText={setNotes}
					placeholder="Empty — use the buttons"
					rows={3}
					showCount
					testID="controlled"
					value={notes}
				/>
				<View className="flex-row gap-2">
					<Button onPress={() => setNotes(TEMPLATE)} size="sm" testID="fill" variant="secondary">
						Fill template
					</Button>
					<Button onPress={() => setNotes("")} size="sm" testID="clear" variant="tertiary">
						Clear
					</Button>
				</View>
				<Text.Caption
					color="muted"
					testID="controlled-lines"
				>{`${lines} ${lines === 1 ? "line" : "lines"} in state`}</Text.Caption>
			</Field>
			<Field>
				<Field.Label>Uncontrolled</Field.Label>
				<Textarea defaultValue="Seeded by defaultValue." maxLength={120} rows={3} showCount testID="uncontrolled" />
			</Field>
		</View>
	);
}
