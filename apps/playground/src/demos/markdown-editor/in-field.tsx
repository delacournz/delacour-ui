import { Field } from "@delacour/react-native-ui/field";
import { MarkdownEditor } from "@delacour/react-native-ui/markdown-editor";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	align: "stretch",
	title: "In a field",
	caption:
		"Inside a `Field` the editor takes the field's invalid and disabled states with nothing said at the call site. Clear the text and the border, caret and error go destructive together.",
	keyboardAware: true,
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [description, setDescription] = useState("");
	const isInvalid = description.trim().length === 0;

	return (
		<Field isInvalid={isInvalid}>
			<Field.Label>Description</Field.Label>
			<MarkdownEditor onValueChange={setDescription} rows={5} testID="in-field" value={description} />
			<Field.Description>Markdown is supported.</Field.Description>
			<Field.Error>{isInvalid ? "Add a description before publishing." : undefined}</Field.Error>
		</Field>
	);
}
