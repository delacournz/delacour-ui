import { Attachment } from "@delacour/react-native-ui/attachment";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Press, long-press and disabled",
	note: "A press opens the attachment and a long-press is the app's menu; the remove control sits beside the press target, so tapping it never opens anything. Disabled dims the whole attachment and stops all three.",
};

export function Demo(): ReactElement {
	const [event, setEvent] = useState("Nothing yet");

	return (
		<View className="gap-3">
			<Attachment
				kind="file"
				name="invoice-0042.pdf"
				onLongPress={() => setEvent("Long-pressed — open a menu")}
				onPress={() => setEvent("Pressed — open a viewer")}
				onRemove={() => setEvent("Removed")}
				removeTestID="attachment-press-remove"
				sizeBytes={154_624}
				testID="attachment-press"
			/>
			<Attachment
				isDisabled
				kind="file"
				name="invoice-0041.pdf"
				onPress={() => setEvent("This never fires")}
				onRemove={() => setEvent("This never fires")}
				sizeBytes={149_504}
				testID="attachment-disabled"
			/>
			<Text.Caption testID="attachment-press-event">{event}</Text.Caption>
		</View>
	);
}
