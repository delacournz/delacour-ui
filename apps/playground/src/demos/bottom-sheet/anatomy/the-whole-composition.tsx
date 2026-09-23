import { BottomSheet } from "@delacour/react-native-ui/bottom-sheet";
import { Button } from "@delacour/react-native-ui/button";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "The whole composition",
	capture: { flow: "bottom-sheet/anatomy/the-whole-composition", frame: "device", hero: true },
};

/**
 * Every part in one sheet, and the four ways it closes.
 *
 * A swipe down, a press on the scrim, `BottomSheet.Close` and the button in the
 * content all reach the same `onOpenChange`, so the counter moves however the
 * sheet was dismissed.
 *
 * The root fills and centres because this demo is captured as a whole screen:
 * the capture stage hands a `device` demo the full window with no insets, and a
 * trigger left at the top sat under the Dynamic Island, where a tap never
 * reached it.
 */
export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);
	const [closes, setCloses] = useState(0);

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) setCloses((count) => count + 1);
	};

	return (
		<View className="flex-1 items-center justify-center gap-3">
			<BottomSheet isOpen={isOpen} onOpenChange={handleOpenChange}>
				<BottomSheet.Trigger asChild>
					<Button testID="open-sheet" variant="secondary">
						Open the sheet
					</Button>
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
							<Button onPress={() => setOpen(false)} testID="sheet-later" variant="tertiary">
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
