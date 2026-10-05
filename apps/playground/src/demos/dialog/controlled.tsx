import { Button } from "@delacour/react-native-ui/button";
import { Dialog } from "@delacour/react-native-ui/dialog";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	caption:
		"`isOpen` and `onOpenChange` from the caller's state. The count goes up once per close, whichever way it closed.",
	align: "center",
};

/** No trigger part at all: any control can open a controlled dialog. */
export function Demo(): ReactElement {
	const [isOpen, setIsOpen] = useState(false);
	const [closes, setCloses] = useState(0);

	const handleOpenChange = (next: boolean) => {
		setIsOpen(next);
		if (!next) setCloses((count) => count + 1);
	};

	return (
		<View className="items-center gap-3">
			<Button onPress={() => setIsOpen(true)} testID="dialog-controlled-open">
				Open
			</Button>
			<Text.Caption color="muted" testID="dialog-controlled-count">{`Closed ${closes} times`}</Text.Caption>
			<Dialog isOpen={isOpen} onOpenChange={handleOpenChange}>
				<Dialog.Content>
					<Dialog.Close />
					<Dialog.Header>
						<Dialog.Title>Controlled</Dialog.Title>
						<Dialog.Description>Close it from the ✕, the scrim, the button or back.</Dialog.Description>
					</Dialog.Header>
					<Dialog.Footer>
						<Dialog.Close asChild>
							<Button testID="dialog-controlled-done">Done</Button>
						</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog>
		</View>
	);
}
