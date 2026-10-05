import { Button } from "@delacour/react-native-ui/button";
import { Dialog } from "@delacour/react-native-ui/dialog";
import { Field } from "@delacour/react-native-ui/field";
import { Input } from "@delacour/react-native-ui/input";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A short form",
	caption: "A field in the body and a `panel` footer. Focus the field: the card lifts just clear of the keyboard.",
	note: "Dismiss the keyboard and the card settles back to the centre. Save stays disabled until the name changes, and closing resets it.",
	align: "center",
	keyboardAware: true,
};

const INITIAL_NAME = "Harbour Bridge";

/** Rename a project — a controlled dialog so Save can close it after it checks the value. */
export function Demo(): ReactElement {
	const [isOpen, setIsOpen] = useState(false);
	const [name, setName] = useState(INITIAL_NAME);

	const handleOpenChange = (next: boolean) => {
		setIsOpen(next);
		if (!next) setName(INITIAL_NAME);
	};

	return (
		<Dialog isOpen={isOpen} onOpenChange={handleOpenChange}>
			<Dialog.Trigger asChild>
				<Button testID="dialog-form-open" variant="secondary">
					Rename
				</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Close />
				<Dialog.Header>
					<Dialog.Title>Rename project</Dialog.Title>
					<Dialog.Description>Everyone with access sees the new name.</Dialog.Description>
				</Dialog.Header>
				<Dialog.Body>
					<Field>
						<Field.Label>Name</Field.Label>
						<Input
							onChangeText={setName}
							placeholder="Project name"
							returnKeyType="done"
							testID="dialog-form-input"
							value={name}
						/>
					</Field>
				</Dialog.Body>
				<Dialog.Footer variant="panel">
					<Dialog.Close asChild>
						<Button variant="secondary">Cancel</Button>
					</Dialog.Close>
					<Button
						isDisabled={name.trim() === "" || name === INITIAL_NAME}
						onPress={() => handleOpenChange(false)}
						testID="dialog-form-save"
					>
						Save
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog>
	);
}
