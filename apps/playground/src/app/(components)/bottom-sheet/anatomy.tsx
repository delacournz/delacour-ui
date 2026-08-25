import { BottomSheet } from "@delacour/native-ui/bottom-sheet";
import { Button } from "@delacour/native-ui/button";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

/**
 * Every part in one sheet, and the four ways it closes.
 *
 * The counter is the point of the second section: a swipe down, a press on the
 * scrim, `BottomSheet.Close` and the button in the content all reach the same
 * `onOpenChange`, so the number moves however the sheet was dismissed.
 */
export default function BottomSheetAnatomyDemo(): ReactElement {
	const [isOpen, setOpen] = useState(false);
	const [closes, setCloses] = useState(0);

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) setCloses((count) => count + 1);
	};

	return (
		<GalleryScreen subtitle={`Closed ${closes} times`} title="Anatomy">
			<Section title="The whole composition">
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
			</Section>

			<Section title="A scrim that does not dismiss">
				<BottomSheet>
					<BottomSheet.Trigger asChild>
						<Button variant="outline">Open</Button>
					</BottomSheet.Trigger>
					<BottomSheet.Portal>
						<BottomSheet.Overlay isCloseOnPress={false} />
						<BottomSheet.Container>
							<BottomSheet.Content>
								<BottomSheet.Title>Confirm first</BottomSheet.Title>
								<BottomSheet.Description>
									Pressing the scrim does nothing here. Swipe down, or use the button.
								</BottomSheet.Description>
								<BottomSheet.Close />
							</BottomSheet.Content>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
			</Section>

			<Section title="Uncontrolled">
				<View className="gap-3">
					<BottomSheet>
						<BottomSheet.Trigger asChild>
							<Button variant="ghost">No isOpen anywhere</Button>
						</BottomSheet.Trigger>
						<BottomSheet.Portal>
							<BottomSheet.Overlay />
							<BottomSheet.Container>
								<BottomSheet.Content>
									<BottomSheet.Title>The sheet holds its own state</BottomSheet.Title>
									<BottomSheet.Description>Nothing on this screen knows whether it is open.</BottomSheet.Description>
								</BottomSheet.Content>
							</BottomSheet.Container>
						</BottomSheet.Portal>
					</BottomSheet>
					<Text.Caption>
						Open the first sheet and dismiss it four different ways. The subtitle counts every one, because
						`onOpenChange` is the only callback there is.
					</Text.Caption>
				</View>
			</Section>
		</GalleryScreen>
	);
}
