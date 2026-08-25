import { BottomSheet, useBottomSheetInput } from "@delacour/native-ui/bottom-sheet";
import { Button } from "@delacour/native-ui/button";
import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

/**
 * Fields inside a sheet, under a footer that rides the keyboard.
 *
 * This is the route that proves the keyboard path, and none of it is visible in
 * a screenshot. `useBottomSheetInput()` is what tells the sheet these fields are
 * its own; without it the sheet does not grow and the last field opens behind
 * the keyboard.
 *
 * The fields are ordinary `Input`s inside ordinary `Field`s — the whole point of
 * exposing the handlers as a hook rather than shipping a sheet-only text field.
 */
export default function BottomSheetFormDemo(): ReactElement {
	const [isOpen, setOpen] = useState(false);

	return (
		<GalleryScreen subtitle="The keyboard path" title="In a form">
			<Section title="A form in a sheet">
				<BottomSheet isOpen={isOpen} onOpenChange={setOpen}>
					<BottomSheet.Trigger asChild>
						<Button variant="secondary">Edit profile</Button>
					</BottomSheet.Trigger>
					<BottomSheet.Portal>
						<BottomSheet.Overlay />
						<BottomSheet.Container>
							<BottomSheet.Content>
								<BottomSheet.Close />
								<BottomSheet.Title>Edit profile</BottomSheet.Title>
								<BottomSheet.Description>Tap the last field and watch the footer.</BottomSheet.Description>
								<SheetField label="Full name" placeholder="Ada Lovelace" />
								<SheetField label="Username" placeholder="ada" />
								<SheetField label="Where you are" placeholder="Wellington" />
							</BottomSheet.Content>
							<BottomSheet.Footer sticky>
								<Button onPress={() => setOpen(false)}>Save</Button>
							</BottomSheet.Footer>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
			</Section>

			<Section title="What to check">
				<Text.Caption>
					Tap the last field. It should sit directly above the Save button, not behind it, and the sheet should grow
					rather than jump. Move between the three fields without dismissing the keyboard — the sheet must not resize
					between taps.
				</Text.Caption>
				<Text.Caption>
					Then dismiss the keyboard: the sheet returns to the height it had. Finally, open the sheet, focus a field, go
					back to the gallery with the keyboard still up, and open it again — it must not float a keyboard-height off
					the bottom of the screen.
				</Text.Caption>
			</Section>
		</GalleryScreen>
	);
}

/**
 * One labelled field that has told the sheet it exists.
 *
 * Written out rather than repeated three times because the hook has to be called
 * per field — it registers that field's own native node.
 */
function SheetField({ label, placeholder }: { label: string; placeholder: string }): ReactElement {
	const [value, setValue] = useState("");
	const sheetInput = useBottomSheetInput();

	return (
		<Field>
			<Field.Label>{label}</Field.Label>
			<Input {...sheetInput} onChangeText={setValue} placeholder={placeholder} value={value} />
		</Field>
	);
}
