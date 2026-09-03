import { BottomSheet } from "delacour-react-native-ui/bottom-sheet";
import { Button } from "delacour-react-native-ui/button";
import { Text } from "delacour-react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "The whole composition",
};

/**
 * Every part in one sheet, and the four ways it closes.
 *
 * A swipe down, a press on the scrim, `BottomSheet.Close` and the button in the
 * content all reach the same `onOpenChange`, so the counter moves however the
 * sheet was dismissed.
 */
export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);
	const [closes, setCloses] = useState(0);

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) setCloses((count) => count + 1);
	};

	return (
		<View className="gap-3">
			<BottomSheet isOpen={isOpen} onOpenChange={handleOpenChange}>
				<BottomSheet.Trigger asChild>
					<Button variant="secondary">Open the sheet</Button>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay />
					<BottomSheet.Container>
						<BottomSheet.Content>
							<BottomSheet.Close />
							<BottomSheet.Title>Keep yourself safe</BottomSheet.Title>
							<BottomSheet.Description>
								Update to the latest version for better security and performance.
							</BottomSheet.Description>
							<Button onPress={() => setOpen(false)}>Update now</Button>
							<Button onPress={() => setOpen(false)} variant="tertiary">
								Later
							</Button>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
			<Text.Caption>{`Closed ${closes} times`}</Text.Caption>
		</View>
	);
}
