import { Support } from "@delacour/react-native-ui/support";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Escalating to a person",
	caption:
		"The reply that reaches a person is the primary-soft chip, and adds the hint “Talk to a person”. Tap it and the handoff lands between the turns.",
};

export function Demo(): ReactElement {
	const [handedOff, setHandedOff] = useState(false);

	return (
		<View className="gap-4">
			<View className="gap-2">
				<Text className="self-start rounded-2xl bg-muted px-3 py-2 text-foreground">
					Try restarting the app, then sign in again.
				</Text>
				{handedOff ? (
					<Support.Handoff>You were passed to Mere, who can see everything you told the assistant.</Support.Handoff>
				) : null}
			</View>
			{handedOff ? null : (
				<Support.Replies>
					<Support.Reply label="That fixed it" onPress={() => {}} />
					<Support.Reply label="Still broken" onPress={() => {}} />
					<Support.Reply
						escalates
						label="Talk to a person"
						onPress={() => setHandedOff(true)}
						testID="support-reply-human"
					/>
				</Support.Replies>
			)}
		</View>
	);
}
