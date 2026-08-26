import { Accordion } from "@delacour/native-ui/accordion";
import { Input } from "@delacour/native-ui/input";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A panel keeps what is inside it",
	caption:
		"Type something, collapse the row, and open it again — the text is still there. A panel mounts on first expand and stays mounted, so a form keeps what was typed and a list keeps where it was scrolled. Nothing renders at all until a row is opened for the first time.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	const [note, setNote] = useState("");

	return (
		<Accordion>
			<Accordion.Item value="note">
				<Accordion.Trigger testID="note">
					<Accordion.Title>Delivery note</Accordion.Title>
					<Accordion.Description>{note ? `${note.length} characters kept` : "Nothing typed yet"}</Accordion.Description>
				</Accordion.Trigger>
				<Accordion.Content>
					<Input onChangeText={setNote} placeholder="Leave it by the side gate" value={note} />
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="gift">
				<Accordion.Trigger testID="gift">Gift options</Accordion.Trigger>
				<Accordion.Content>
					<Text.Paragraph>This one has never been opened, so its panel has never been rendered.</Text.Paragraph>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion>
	);
}
