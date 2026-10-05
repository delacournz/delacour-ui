import { Message } from "@delacour/react-native-ui/message";
import { type ReactElement, useState } from "react";
import { Alert, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Long press",
	caption:
		'`onLongPress` is the message\'s action menu, which the app hosts. `isSelected` tints the row and outlines the bubble while that menu is open — here an alert stands in for it. A screen reader reaches it as a "More actions" action.',
};

export function Demo(): ReactElement {
	const [isSelected, setSelected] = useState(false);

	const openMenu = () => {
		setSelected(true);
		Alert.alert("Message", undefined, [
			{ onPress: () => setSelected(false), text: "Reply" },
			{ onPress: () => setSelected(false), style: "cancel", text: "Cancel" },
		]);
	};

	return (
		<View className="w-full">
			<Message direction="incoming" isSelected={isSelected} onLongPress={openMenu}>
				<Message.Bubble>
					<Message.Text testID="message-long-press">Hold this message.</Message.Text>
				</Message.Bubble>
			</Message>
		</View>
	);
}
