import { Field } from "@delacour/react-native-ui/field";
import { Textarea } from "@delacour/react-native-ui/textarea";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Auto-grow",
	caption:
		"`autoGrow` starts at `rows` and grows a line at a time up to `maxRows`, then scrolls. Clear it and it goes back to two rows, not one.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	const [message, setMessage] = useState("");

	return (
		<Field>
			<Field.Label>Message</Field.Label>
			<Textarea
				autoGrow
				maxRows={6}
				onChangeText={setMessage}
				placeholder="Type, and press return a few times"
				rows={2}
				testID="auto-grow"
				value={message}
			/>
			<Field.Description>Grows from two rows to six.</Field.Description>
		</Field>
	);
}
