import { Button } from "@delacour/react-native-ui/button";
import { Fab } from "@delacour/react-native-ui/fab";
import { IconCamera1, IconNoteText, IconPlusLarge } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled dial",
	caption:
		"`isOpen` and `onOpenChange` hand the dial's state to the screen. Here a button outside opens it, and the last action pressed is written above — pressing one also closes the dial.",
};

export function Demo(): ReactElement {
	const [isOpen, setIsOpen] = useState(false);
	const [last, setLast] = useState("Nothing yet");

	return (
		<View className="h-96 overflow-hidden rounded-xl border border-border bg-background">
			<View className="items-start gap-3 p-4">
				<Text className="text-muted-foreground">Last action: {last}</Text>
				<Button onPress={() => setIsOpen(true)} size="sm" testID="open-dial" variant="outline">
					Open the dial
				</Button>
			</View>
			<Fab.Group
				accessibilityLabel="Create"
				icon={IconPlusLarge}
				isOpen={isOpen}
				isSafeAreaAware={false}
				label="Create"
				onOpenChange={setIsOpen}
				placement="bottom-start"
			>
				<Fab.Action icon={IconNoteText} label="Note" onPress={() => setLast("Note")} />
				<Fab.Action icon={IconCamera1} label="Photo" onPress={() => setLast("Photo")} />
			</Fab.Group>
		</View>
	);
}
