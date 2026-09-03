import { BottomSheet, useBottomSheetInput } from "delacour-react-native-ui/bottom-sheet";
import { Button } from "delacour-react-native-ui/button";
import { Field } from "delacour-react-native-ui/field";
import { Input } from "delacour-react-native-ui/input";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A form in a sheet",
	note: "Tap the last field. It should sit directly above the Save button, not behind it, and the sheet should grow rather than jump. Move between the three fields without dismissing the keyboard — the sheet must not resize between taps.\n\nThen dismiss the keyboard: the sheet returns to the height it had. Finally, open the sheet, focus a field, go back to the gallery with the keyboard still up, and open it again — it must not float a keyboard-height off the bottom of the screen.",
	keyboardAware: true,
};

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

/**
 * Fields inside a sheet, under a footer that rides the keyboard.
 *
 * `useBottomSheetInput()` is what tells the sheet these fields are its own;
 * without it the sheet does not grow and the last field opens behind the
 * keyboard.
 *
 * The fields are ordinary `Input`s inside ordinary `Field`s — the whole point of
 * exposing the handlers as a hook rather than shipping a sheet-only text field.
 */
export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);

	return (
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
	);
}
